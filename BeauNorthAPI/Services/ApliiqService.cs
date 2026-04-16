using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using BeauNorthAPI.DTOs.Apliiq;
using BeauNorthAPI.Models;
using BeauNorthAPI.Options;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using BeauNorthApi.Data;

namespace BeauNorthAPI.Services
{
    public class ApliiqService : IApliiqService
    {
        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNamingPolicy = null,
            DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
        };

        private readonly HttpClient _httpClient;
        private readonly ApliiqOptions _options;
        private readonly AppDbContext _context;

        public ApliiqService(
            HttpClient httpClient,
            IOptions<ApliiqOptions> options,
            AppDbContext context)
        {
            _httpClient = httpClient;
            _options = options.Value;
            _context = context;

            if (!string.IsNullOrWhiteSpace(_options.BaseUrl))
            {
                _httpClient.BaseAddress = new Uri(_options.BaseUrl.TrimEnd('/') + "/");
            }
        }

        public Task<object> GetConfigurationSummaryAsync()
        {
            var summary = new
            {
                BaseUrl = _options.BaseUrl,
                HasApiKey = !string.IsNullOrWhiteSpace(_options.ApiKey),
                HasSharedSecret = !string.IsNullOrWhiteSpace(_options.SharedSecret),
                ApiKeyPreview = string.IsNullOrWhiteSpace(_options.ApiKey)
                    ? string.Empty
                    : $"{_options.ApiKey[..Math.Min(4, _options.ApiKey.Length)]}****"
            };

            return Task.FromResult<object>(summary);
        }

        public Task<bool> ValidateConfigurationAsync()
        {
            var valid =
                !string.IsNullOrWhiteSpace(_options.BaseUrl) &&
                !string.IsNullOrWhiteSpace(_options.ApiKey) &&
                !string.IsNullOrWhiteSpace(_options.SharedSecret);

            return Task.FromResult(valid);
        }

        public async Task<ApliiqCreateOrderResult> SubmitOrderAsync(Order order)
        {
            if (order.ShippingAddress == null)
            {
                throw new InvalidOperationException("Order must include a shipping address before submission.");
            }

            var orderItems = order.OrderItems.ToList();
            if (!orderItems.Any())
            {
                throw new InvalidOperationException("Order has no items.");
            }

            var productIds = orderItems.Select(x => x.ProductId).Distinct().ToList();

            var products = await _context.Products
                .Where(p => productIds.Contains(p.ProductId))
                .ToDictionaryAsync(p => p.ProductId);

            var anyNonApliiq = orderItems.Any(oi =>
                !products.TryGetValue(oi.ProductId, out var product) ||
                !product.IsFulfillmentEnabled ||
                !string.Equals(product.FulfillmentProvider, "Apliiq", StringComparison.OrdinalIgnoreCase));

            if (anyNonApliiq)
            {
                throw new InvalidOperationException("All items in the order must be Apliiq-enabled for automatic Apliiq submission.");
            }

            var payload = BuildCreateOrderPayload(order, orderItems, products);
            var json = JsonSerializer.Serialize(payload, JsonOptions);

            using var request = new HttpRequestMessage(HttpMethod.Post, "v1/Order");
            request.Headers.Add("Accept", "application/json");
            request.Headers.Add("x-apliiq-auth", BuildAuthorizationHeader(json));
            request.Content = new StringContent(json, Encoding.UTF8, "application/json");

            using var response = await _httpClient.SendAsync(request);
            var raw = await response.Content.ReadAsStringAsync();

            var result = new ApliiqCreateOrderResult
            {
                StatusCode = (int)response.StatusCode,
                RawResponse = raw,
                Success = response.IsSuccessStatusCode,
                AcceptedButPending = (int)response.StatusCode == 202,
                ProviderOrderId = TryExtractProviderOrderId(raw),
                Message = TryExtractMessage(raw)
            };

            return result;
        }

        public async Task<string> GetOrderRawAsync(string apliiqOrderId)
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, $"v1/Order/{apliiqOrderId}");
            request.Headers.Add("Accept", "application/json");
            request.Headers.Add("x-apliiq-auth", BuildAuthorizationHeader(string.Empty));

            using var response = await _httpClient.SendAsync(request);
            var raw = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                throw new InvalidOperationException($"Apliiq get order failed: {(int)response.StatusCode} - {raw}");
            }

            return raw;
        }

        public bool VerifyWebhookSignature(string rawRequestBody, string? providedHmacHeader)
        {
            if (string.IsNullOrWhiteSpace(providedHmacHeader))
            {
                return false;
            }

            var payloadBase64 = Convert.ToBase64String(Encoding.UTF8.GetBytes(rawRequestBody));
            var computed = ComputeBase64Hmac(payloadBase64);

            return CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(computed),
                Encoding.UTF8.GetBytes(providedHmacHeader.Trim()));
        }

        private ApliiqCreateOrderRequest BuildCreateOrderPayload(
            Order order,
            List<OrderItem> orderItems,
            Dictionary<int, Product> products)
        {
            var shipping = order.ShippingAddress!;
            var (firstName, lastName) = SplitName(shipping.FullName);
            var provinceCode = NormalizeProvinceCode(shipping.State);
            var countryCode = NormalizeCountryCode(shipping.Country);

            var address = new ApliiqAddress
            {
                FirstName = firstName,
                LastName = lastName,
                Name = shipping.FullName,
                Address1 = shipping.AddressLine1,
                Address2 = string.IsNullOrWhiteSpace(shipping.AddressLine2) ? null : shipping.AddressLine2,
                City = shipping.City,
                Province = shipping.State,
                ProvinceCode = provinceCode,
                Zip = shipping.PostalCode,
                Country = shipping.Country,
                CountryCode = countryCode,
                Phone = string.Empty
            };

            var payload = new ApliiqCreateOrderRequest
            {
                Number = order.OrderNumber,
                Name = $"#{order.OrderNumber}",
                OrderNumber = order.OrderNumber,
                BillingAddress = address,
                ShippingAddress = address
            };

            foreach (var item in orderItems)
            {
                var product = products[item.ProductId];
                var supplierSku = !string.IsNullOrWhiteSpace(product.ExternalSku)
                    ? product.ExternalSku!
                    : item.ProductSkuSnapshot;

                var displayName = item.ProductNameSnapshot;
                if (!string.IsNullOrWhiteSpace(item.SizeSelected) || !string.IsNullOrWhiteSpace(item.ColorSelected))
                {
                    displayName = $"{displayName} - {item.SizeSelected ?? "One Size"} / {item.ColorSelected ?? "Default"}";
                }

                payload.LineItems.Add(new ApliiqLineItem
                {
                    Id = item.OrderItemId.ToString(),
                    Title = item.ProductNameSnapshot,
                    Quantity = item.Quantity,
                    Price = item.UnitPrice.ToString("0.00", CultureInfo.InvariantCulture),
                    Grams = 0,
                    Sku = supplierSku,
                    Name = displayName
                });
            }

            return payload;
        }

        private string BuildAuthorizationHeader(string requestJson)
        {
            var rts = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
            var state = Guid.NewGuid().ToString("N");
            var bodyBase64 = string.IsNullOrWhiteSpace(requestJson)
                ? string.Empty
                : Convert.ToBase64String(Encoding.UTF8.GetBytes(requestJson));

            var signingString = $"{_options.ApiKey}{rts}{state}{bodyBase64}";
            var signature = ComputeBase64Hmac(signingString);

            return $"{rts}:{signature}:{_options.ApiKey}:{state}";
        }

        private string ComputeBase64Hmac(string valueToSign)
        {
            var secretBytes = Encoding.UTF8.GetBytes(_options.SharedSecret);
            var valueBytes = Encoding.UTF8.GetBytes(valueToSign);

            using var hmac = new HMACSHA256(secretBytes);
            var hash = hmac.ComputeHash(valueBytes);

            return Convert.ToBase64String(hash);
        }

        private static (string FirstName, string LastName) SplitName(string fullName)
        {
            var trimmed = (fullName ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(trimmed))
            {
                return ("Customer", "Customer");
            }

            var parts = trimmed.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length == 1)
            {
                return (parts[0], parts[0]);
            }

            return (parts[0], string.Join(" ", parts.Skip(1)));
        }

        private static string NormalizeCountryCode(string country)
        {
            var value = (country ?? string.Empty).Trim().ToUpperInvariant();

            return value switch
            {
                "US" or "USA" or "UNITED STATES" or "UNITED STATES OF AMERICA" => "US",
                "CA" or "CANADA" => "CA",
                _ when value.Length == 2 => value,
                _ => "US"
            };
        }

        private static string NormalizeProvinceCode(string state)
        {
            var value = (state ?? string.Empty).Trim().ToUpperInvariant();

            if (value.Length == 2)
            {
                return value;
            }

            var map = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["ALABAMA"] = "AL",
                ["ALASKA"] = "AK",
                ["ARIZONA"] = "AZ",
                ["ARKANSAS"] = "AR",
                ["CALIFORNIA"] = "CA",
                ["COLORADO"] = "CO",
                ["CONNECTICUT"] = "CT",
                ["DELAWARE"] = "DE",
                ["FLORIDA"] = "FL",
                ["GEORGIA"] = "GA",
                ["HAWAII"] = "HI",
                ["IDAHO"] = "ID",
                ["ILLINOIS"] = "IL",
                ["INDIANA"] = "IN",
                ["IOWA"] = "IA",
                ["KANSAS"] = "KS",
                ["KENTUCKY"] = "KY",
                ["LOUISIANA"] = "LA",
                ["MAINE"] = "ME",
                ["MARYLAND"] = "MD",
                ["MASSACHUSETTS"] = "MA",
                ["MICHIGAN"] = "MI",
                ["MINNESOTA"] = "MN",
                ["MISSISSIPPI"] = "MS",
                ["MISSOURI"] = "MO",
                ["MONTANA"] = "MT",
                ["NEBRASKA"] = "NE",
                ["NEVADA"] = "NV",
                ["NEW HAMPSHIRE"] = "NH",
                ["NEW JERSEY"] = "NJ",
                ["NEW MEXICO"] = "NM",
                ["NEW YORK"] = "NY",
                ["NORTH CAROLINA"] = "NC",
                ["NORTH DAKOTA"] = "ND",
                ["OHIO"] = "OH",
                ["OKLAHOMA"] = "OK",
                ["OREGON"] = "OR",
                ["PENNSYLVANIA"] = "PA",
                ["RHODE ISLAND"] = "RI",
                ["SOUTH CAROLINA"] = "SC",
                ["SOUTH DAKOTA"] = "SD",
                ["TENNESSEE"] = "TN",
                ["TEXAS"] = "TX",
                ["UTAH"] = "UT",
                ["VERMONT"] = "VT",
                ["VIRGINIA"] = "VA",
                ["WASHINGTON"] = "WA",
                ["WEST VIRGINIA"] = "WV",
                ["WISCONSIN"] = "WI",
                ["WYOMING"] = "WY"
            };

            return map.TryGetValue(value, out var code) ? code : value;
        }

        private static string? TryExtractProviderOrderId(string raw)
        {
            try
            {
                using var doc = JsonDocument.Parse(raw);
                var root = doc.RootElement;

                if (root.ValueKind == JsonValueKind.Object)
                {
                    if (root.TryGetProperty("OrderId", out var orderId))
                    {
                        return orderId.ToString();
                    }

                    if (root.TryGetProperty("order_id", out var orderId2))
                    {
                        return orderId2.ToString();
                    }
                }

                if (root.ValueKind == JsonValueKind.Array && root.GetArrayLength() > 0)
                {
                    var first = root[0];
                    if (first.TryGetProperty("OrderId", out var orderId))
                    {
                        return orderId.ToString();
                    }

                    if (first.TryGetProperty("order_id", out var orderId2))
                    {
                        return orderId2.ToString();
                    }
                }
            }
            catch
            {
            }

            return null;
        }

        private static string? TryExtractMessage(string raw)
        {
            try
            {
                using var doc = JsonDocument.Parse(raw);
                var root = doc.RootElement;

                if (root.ValueKind == JsonValueKind.Object)
                {
                    if (root.TryGetProperty("message", out var message))
                    {
                        return message.ToString();
                    }

                    if (root.TryGetProperty("Message", out var message2))
                    {
                        return message2.ToString();
                    }
                }
            }
            catch
            {
            }

            return null;
        }
    }
}