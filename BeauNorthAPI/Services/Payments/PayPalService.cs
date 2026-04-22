using System.Globalization;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using BeauNorthAPI.Models;
using BeauNorthAPI.Options;
using Microsoft.Extensions.Options;

namespace BeauNorthAPI.Services.Payments
{
    public class PayPalService : IPayPalService
    {
        private readonly HttpClient _httpClient;
        private readonly PayPalOptions _options;

        public PayPalService(HttpClient httpClient, IOptions<PayPalOptions> options)
        {
            _httpClient = httpClient;
            _options = options.Value;

            if (!string.IsNullOrWhiteSpace(_options.BaseUrl))
            {
                _httpClient.BaseAddress = new Uri(_options.BaseUrl.TrimEnd('/') + "/");
            }
        }

        public async Task<PayPalCreateOrderResult> CreateOrderAsync(Order order, CancellationToken cancellationToken = default)
        {
            if (order.ShippingAddress == null)
            {
                throw new InvalidOperationException("Order must have a shipping address before creating a PayPal order.");
            }

            var accessToken = await GetAccessTokenAsync(cancellationToken);

            var payload = new
            {
                intent = "CAPTURE",
                purchase_units = new[]
                {
                    new
                    {
                        reference_id = order.OrderNumber,
                        description = $"Beau North Order {order.OrderNumber}",
                        amount = new
                        {
                            currency_code = "USD",
                            value = FormatMoney(order.TotalAmount),
                            breakdown = new
                            {
                                item_total = new
                                {
                                    currency_code = "USD",
                                    value = FormatMoney(order.Subtotal)
                                },
                                shipping = new
                                {
                                    currency_code = "USD",
                                    value = FormatMoney(order.ShippingAmount)
                                },
                                tax_total = new
                                {
                                    currency_code = "USD",
                                    value = FormatMoney(order.TaxAmount)
                                }
                            }
                        },
                        shipping = new
                        {
                            name = new
                            {
                                full_name = order.ShippingAddress.FullName
                            },
                            address = new
                            {
                                address_line_1 = order.ShippingAddress.AddressLine1,
                                address_line_2 = string.IsNullOrWhiteSpace(order.ShippingAddress.AddressLine2)
                                    ? null
                                    : order.ShippingAddress.AddressLine2,
                                admin_area_2 = order.ShippingAddress.City,
                                admin_area_1 = order.ShippingAddress.State,
                                postal_code = order.ShippingAddress.PostalCode,
                                country_code = NormalizeCountryCode(order.ShippingAddress.Country)
                            }
                        }
                    }
                }
            };

            var json = JsonSerializer.Serialize(payload);
            using var request = new HttpRequestMessage(HttpMethod.Post, "v2/checkout/orders");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            request.Content = new StringContent(json, Encoding.UTF8, "application/json");

            using var response = await _httpClient.SendAsync(request, cancellationToken);
            var raw = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                throw new InvalidOperationException($"PayPal create order failed: {(int)response.StatusCode} - {raw}");
            }

            using var doc = JsonDocument.Parse(raw);
            var root = doc.RootElement;

            return new PayPalCreateOrderResult
            {
                OrderId = root.GetProperty("id").GetString() ?? throw new InvalidOperationException("PayPal order id missing."),
                Status = root.TryGetProperty("status", out var statusEl) ? statusEl.GetString() ?? string.Empty : string.Empty,
                RawResponse = raw
            };
        }

        public async Task<PayPalCaptureOrderResult> CaptureOrderAsync(string payPalOrderId, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(payPalOrderId))
            {
                throw new ArgumentException("PayPal order id is required.", nameof(payPalOrderId));
            }

            var accessToken = await GetAccessTokenAsync(cancellationToken);

            using var request = new HttpRequestMessage(HttpMethod.Post, $"v2/checkout/orders/{payPalOrderId}/capture");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            request.Content = new StringContent("{}", Encoding.UTF8, "application/json");

            using var response = await _httpClient.SendAsync(request, cancellationToken);
            var raw = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                throw new InvalidOperationException($"PayPal capture failed: {(int)response.StatusCode} - {raw}");
            }

            using var doc = JsonDocument.Parse(raw);
            var root = doc.RootElement;

            var status = root.TryGetProperty("status", out var statusEl)
                ? statusEl.GetString() ?? string.Empty
                : string.Empty;

            string? captureId = null;
            string? payerEmail = null;
            string? fundingSource = null;

            if (root.TryGetProperty("payer", out var payerEl) &&
                payerEl.TryGetProperty("email_address", out var emailEl))
            {
                payerEmail = emailEl.GetString();
            }

            if (root.TryGetProperty("payment_source", out var paymentSourceEl))
            {
                if (paymentSourceEl.TryGetProperty("venmo", out _))
                {
                    fundingSource = "venmo";
                }
                else if (paymentSourceEl.TryGetProperty("paypal", out _))
                {
                    fundingSource = "paypal";
                }
                else if (paymentSourceEl.TryGetProperty("card", out _))
                {
                    fundingSource = "card";
                }
            }

            if (root.TryGetProperty("purchase_units", out var purchaseUnitsEl) &&
                purchaseUnitsEl.ValueKind == JsonValueKind.Array &&
                purchaseUnitsEl.GetArrayLength() > 0)
            {
                var firstPurchaseUnit = purchaseUnitsEl[0];

                if (firstPurchaseUnit.TryGetProperty("payments", out var paymentsEl) &&
                    paymentsEl.TryGetProperty("captures", out var capturesEl) &&
                    capturesEl.ValueKind == JsonValueKind.Array &&
                    capturesEl.GetArrayLength() > 0)
                {
                    var firstCapture = capturesEl[0];

                    if (firstCapture.TryGetProperty("id", out var captureIdEl))
                    {
                        captureId = captureIdEl.GetString();
                    }

                    if (string.IsNullOrWhiteSpace(fundingSource) &&
                        firstCapture.TryGetProperty("payment_source", out var capturePaymentSourceEl))
                    {
                        if (capturePaymentSourceEl.TryGetProperty("venmo", out _))
                        {
                            fundingSource = "venmo";
                        }
                        else if (capturePaymentSourceEl.TryGetProperty("paypal", out _))
                        {
                            fundingSource = "paypal";
                        }
                        else if (capturePaymentSourceEl.TryGetProperty("card", out _))
                        {
                            fundingSource = "card";
                        }
                    }
                }
            }

            return new PayPalCaptureOrderResult
            {
                Success = string.Equals(status, "COMPLETED", StringComparison.OrdinalIgnoreCase),
                Status = status,
                CaptureId = captureId,
                PayerEmail = payerEmail,
                FundingSource = fundingSource,
                RawResponse = raw
            };
        }

        private async Task<string> GetAccessTokenAsync(CancellationToken cancellationToken)
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, "v1/oauth2/token");

            var credentials = Convert.ToBase64String(
                Encoding.ASCII.GetBytes($"{_options.ClientId}:{_options.ClientSecret}")
            );

            request.Headers.Authorization = new AuthenticationHeaderValue("Basic", credentials);
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            request.Content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["grant_type"] = "client_credentials"
            });

            using var response = await _httpClient.SendAsync(request, cancellationToken);
            var raw = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                throw new InvalidOperationException($"PayPal token request failed: {(int)response.StatusCode} - {raw}");
            }

            using var doc = JsonDocument.Parse(raw);
            var root = doc.RootElement;

            return root.GetProperty("access_token").GetString()
                ?? throw new InvalidOperationException("PayPal access token missing.");
        }

        private static string FormatMoney(decimal amount)
        {
            return amount.ToString("0.00", CultureInfo.InvariantCulture);
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
    }
}