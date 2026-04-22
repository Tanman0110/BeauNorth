using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BeauNorthApi.Data;
using BeauNorthAPI.DTOs.Checkout;
using BeauNorthAPI.Models;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Net.Http.Headers;
using BeauNorthAPI.Services.Apliiq;
using Microsoft.Extensions.Configuration;

namespace BeauNorthAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CheckoutController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IApliiqService _apliiqService;
        private readonly IConfiguration _configuration;

        public CheckoutController(
            AppDbContext context,
            IApliiqService apliiqService,
            IConfiguration configuration)
        {
            _context = context;
            _apliiqService = apliiqService;
            _configuration = configuration;
        }

        [HttpPost]
        public async Task<IActionResult> Checkout(CheckoutRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = GetAuthenticatedUserId();
            if (userId == null)
            {
                return Unauthorized();
            }

            var cart = await _context.Carts
                .Include(c => c.CartItems)
                    .ThenInclude(ci => ci.Product)
                .FirstOrDefaultAsync(c => c.UserId == userId.Value);

            if (cart == null || !cart.CartItems.Any())
            {
                return BadRequest("Cart is empty.");
            }

            foreach (var cartItem in cart.CartItems)
            {
                if (cartItem.Product == null || !cartItem.Product.IsActive)
                {
                    return BadRequest("One or more products are no longer available.");
                }

                if (cartItem.Quantity > cartItem.Product.StockQuantity)
                {
                    return BadRequest($"Insufficient stock for {cartItem.Product.Name}.");
                }
            }

            var hasApliiqItems = cart.CartItems.Any(ci =>
                ci.Product != null &&
                ci.Product.IsFulfillmentEnabled &&
                string.Equals(ci.Product.FulfillmentProvider, "Apliiq", StringComparison.OrdinalIgnoreCase));

            var hasManualItems = cart.CartItems.Any(ci =>
                ci.Product == null ||
                !ci.Product.IsFulfillmentEnabled ||
                !string.Equals(ci.Product.FulfillmentProvider, "Apliiq", StringComparison.OrdinalIgnoreCase));

            if (hasApliiqItems && hasManualItems)
            {
                return BadRequest("Mixed carts are not supported yet. Please checkout Apliiq products separately from manual products.");
            }

            var subtotal = CalculateSubtotal(cart.CartItems);
            var taxAmount = Math.Round(subtotal * 0.06m, 2);
            var shippingAmount = CalculateShippingAmount(
                cart.CartItems.Sum(ci => ci.Quantity),
                subtotal
            );
            var totalAmount = subtotal + taxAmount + shippingAmount;

            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var order = new Order
                {
                    UserId = userId.Value,
                    OrderNumber = $"ORD-{DateTime.UtcNow:yyyyMMddHHmmssfff}",
                    Status = hasApliiqItems ? "SubmittingToFulfillment" : "Pending",
                    Subtotal = subtotal,
                    TaxAmount = taxAmount,
                    ShippingAmount = shippingAmount,
                    TotalAmount = totalAmount,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Orders.Add(order);
                await _context.SaveChangesAsync();

                var orderItems = cart.CartItems.Select(ci => new OrderItem
                {
                    OrderId = order.OrderId,
                    ProductId = ci.ProductId,
                    Quantity = ci.Quantity,
                    UnitPrice = ci.UnitPrice,
                    ProductNameSnapshot = ci.Product?.Name ?? string.Empty,
                    ProductSkuSnapshot = ci.Product?.Sku ?? string.Empty,
                    SizeSelected = ci.SizeSelected,
                    ColorSelected = ci.ColorSelected
                }).ToList();

                _context.OrderItems.AddRange(orderItems);

                var shippingAddress = new ShippingAddress
                {
                    OrderId = order.OrderId,
                    FullName = request.FullName.Trim(),
                    AddressLine1 = request.AddressLine1.Trim(),
                    AddressLine2 = request.AddressLine2?.Trim(),
                    City = request.City.Trim(),
                    State = request.State.Trim(),
                    PostalCode = request.PostalCode.Trim(),
                    Country = request.Country.Trim()
                };

                _context.ShippingAddresses.Add(shippingAddress);

                var payment = new Payment
                {
                    OrderId = order.OrderId,
                    Provider = request.PaymentProvider.Trim(),
                    ProviderPaymentId = $"demo_{Guid.NewGuid():N}",
                    Status = hasApliiqItems ? "AcceptedForSubmission" : "Pending",
                    Amount = totalAmount,
                    PaidAt = null
                };

                _context.Payments.Add(payment);

                var fulfillment = new FulfillmentOrder
                {
                    OrderId = order.OrderId,
                    Provider = hasApliiqItems ? "Apliiq" : "Manual",
                    ProviderOrderId = null,
                    FulfillmentStatus = hasApliiqItems ? "Submitting" : "Pending",
                    TrackingNumber = null,
                    TrackingUrl = null,
                    SubmittedAt = null,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.FulfillmentOrders.Add(fulfillment);

                foreach (var cartItem in cart.CartItems)
                {
                    if (cartItem.Product != null)
                    {
                        cartItem.Product.StockQuantity -= cartItem.Quantity;
                        cartItem.Product.UpdatedAt = DateTime.UtcNow;
                    }
                }

                _context.CartItems.RemoveRange(cart.CartItems);

                await _context.SaveChangesAsync();

                if (hasApliiqItems)
                {
                    var hydratedOrder = await _context.Orders
                        .Include(o => o.OrderItems)
                        .Include(o => o.ShippingAddress)
                        .Include(o => o.Payment)
                        .Include(o => o.FulfillmentOrder)
                        .FirstAsync(o => o.OrderId == order.OrderId);

                    var apliiqResult = await _apliiqService.SubmitOrderAsync(hydratedOrder);

                    hydratedOrder.FulfillmentOrder!.ProviderOrderId = apliiqResult.ProviderOrderId;
                    hydratedOrder.FulfillmentOrder.SubmittedAt = DateTime.UtcNow;
                    hydratedOrder.FulfillmentOrder.UpdatedAt = DateTime.UtcNow;

                    if (apliiqResult.Success)
                    {
                        hydratedOrder.FulfillmentOrder.FulfillmentStatus =
                            apliiqResult.AcceptedButPending ? "AcceptedPendingReview" : "Submitted";

                        hydratedOrder.Status =
                            apliiqResult.AcceptedButPending ? "FulfillmentPendingReview" : "SubmittedToFulfillment";
                    }
                    else
                    {
                        hydratedOrder.FulfillmentOrder.FulfillmentStatus = "SubmissionFailed";
                        hydratedOrder.Status = "FulfillmentSubmissionFailed";
                    }

                    hydratedOrder.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }

                await transaction.CommitAsync();

                return Ok(new
                {
                    order.OrderId,
                    order.OrderNumber,
                    order.TotalAmount,
                    Status = hasApliiqItems ? "SubmittedToFulfillment" : order.Status
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new
                {
                    message = "Checkout failed.",
                    detail = ex.Message
                });
            }
        }

        [HttpPost("paypal/create-order")]
        public async Task<IActionResult> CreatePayPalOrder(CheckoutRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = GetAuthenticatedUserId();
            if (userId == null)
            {
                return Unauthorized();
            }

            var cart = await _context.Carts
                .Include(c => c.CartItems)
                    .ThenInclude(ci => ci.Product)
                .FirstOrDefaultAsync(c => c.UserId == userId.Value);

            if (cart == null || !cart.CartItems.Any())
            {
                return BadRequest("Cart is empty.");
            }

            foreach (var cartItem in cart.CartItems)
            {
                if (cartItem.Product == null || !cartItem.Product.IsActive)
                {
                    return BadRequest("One or more products are no longer available.");
                }

                if (cartItem.Quantity > cartItem.Product.StockQuantity)
                {
                    return BadRequest($"Insufficient stock for {cartItem.Product.Name}.");
                }
            }

            var hasApliiqItems = cart.CartItems.Any(ci =>
                ci.Product != null &&
                ci.Product.IsFulfillmentEnabled &&
                string.Equals(ci.Product.FulfillmentProvider, "Apliiq", StringComparison.OrdinalIgnoreCase));

            var hasManualItems = cart.CartItems.Any(ci =>
                ci.Product == null ||
                !ci.Product.IsFulfillmentEnabled ||
                !string.Equals(ci.Product.FulfillmentProvider, "Apliiq", StringComparison.OrdinalIgnoreCase));

            if (hasApliiqItems && hasManualItems)
            {
                return BadRequest("Mixed carts are not supported yet. Please checkout Apliiq products separately from manual products.");
            }

            var subtotal = CalculateSubtotal(cart.CartItems);
            var taxAmount = Math.Round(subtotal * 0.06m, 2);
            var shippingAmount = CalculateShippingAmount(
                cart.CartItems.Sum(ci => ci.Quantity),
                subtotal
            );
            var totalAmount = subtotal + taxAmount + shippingAmount;

            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var order = new Order
                {
                    UserId = userId.Value,
                    OrderNumber = $"ORD-{DateTime.UtcNow:yyyyMMddHHmmssfff}",
                    Status = "PendingPayment",
                    Subtotal = subtotal,
                    TaxAmount = taxAmount,
                    ShippingAmount = shippingAmount,
                    TotalAmount = totalAmount,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Orders.Add(order);
                await _context.SaveChangesAsync();

                var orderItems = cart.CartItems.Select(ci => new OrderItem
                {
                    OrderId = order.OrderId,
                    ProductId = ci.ProductId,
                    Quantity = ci.Quantity,
                    UnitPrice = ci.UnitPrice,
                    ProductNameSnapshot = ci.Product?.Name ?? string.Empty,
                    ProductSkuSnapshot = ci.Product?.Sku ?? string.Empty,
                    SizeSelected = ci.SizeSelected,
                    ColorSelected = ci.ColorSelected
                }).ToList();

                _context.OrderItems.AddRange(orderItems);

                var shippingAddress = new ShippingAddress
                {
                    OrderId = order.OrderId,
                    FullName = request.FullName.Trim(),
                    AddressLine1 = request.AddressLine1.Trim(),
                    AddressLine2 = request.AddressLine2?.Trim(),
                    City = request.City.Trim(),
                    State = request.State.Trim(),
                    PostalCode = request.PostalCode.Trim(),
                    Country = request.Country.Trim()
                };

                _context.ShippingAddresses.Add(shippingAddress);

                var payment = new Payment
                {
                    OrderId = order.OrderId,
                    Provider = "PayPal",
                    ProviderPaymentId = null,
                    Status = "PendingApproval",
                    Amount = totalAmount,
                    PaidAt = null
                };

                _context.Payments.Add(payment);

                var fulfillment = new FulfillmentOrder
                {
                    OrderId = order.OrderId,
                    Provider = hasApliiqItems ? "Apliiq" : "Manual",
                    ProviderOrderId = null,
                    FulfillmentStatus = "AwaitingPayment",
                    TrackingNumber = null,
                    TrackingUrl = null,
                    SubmittedAt = null,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.FulfillmentOrders.Add(fulfillment);
                await _context.SaveChangesAsync();

                var payPalOrderId = await CreatePayPalOrderWithProvider(order);
                payment.ProviderPaymentId = payPalOrderId;
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return Ok(new
                {
                    orderId = order.OrderId,
                    orderNumber = order.OrderNumber,
                    payPalOrderId,
                    subtotal = order.Subtotal,
                    taxAmount = order.TaxAmount,
                    shippingAmount = order.ShippingAmount,
                    totalAmount = order.TotalAmount
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new
                {
                    message = "Failed to create PayPal order.",
                    detail = ex.Message
                });
            }
        }

        [HttpPost("paypal/capture-order")]
        public async Task<IActionResult> CapturePayPalOrder([FromBody] CapturePayPalOrderRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = GetAuthenticatedUserId();
            if (userId == null)
            {
                return Unauthorized();
            }

            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .Include(o => o.ShippingAddress)
                .Include(o => o.Payment)
                .Include(o => o.FulfillmentOrder)
                .FirstOrDefaultAsync(o => o.OrderId == request.OrderId && o.UserId == userId.Value);

            if (order == null)
            {
                return NotFound("Order not found.");
            }

            if (order.Payment == null || order.Payment.Provider != "PayPal")
            {
                return BadRequest("PayPal payment record not found.");
            }

            if (!string.Equals(order.Payment.ProviderPaymentId, request.PayPalOrderId, StringComparison.Ordinal))
            {
                return BadRequest("PayPal order mismatch.");
            }

            if (string.Equals(order.Payment.Status, "Paid", StringComparison.OrdinalIgnoreCase))
            {
                return Ok(new
                {
                    order.OrderId,
                    order.OrderNumber,
                    order.TotalAmount,
                    order.Status
                });
            }

            var captureSucceeded = await CapturePayPalOrderWithProvider(request.PayPalOrderId);
            if (!captureSucceeded)
            {
                return BadRequest("PayPal capture failed.");
            }

            var cart = await _context.Carts
                .Include(c => c.CartItems)
                    .ThenInclude(ci => ci.Product)
                .FirstOrDefaultAsync(c => c.UserId == userId.Value);

            if (cart == null || !cart.CartItems.Any())
            {
                return BadRequest("Cart is empty.");
            }

            foreach (var cartItem in cart.CartItems)
            {
                if (cartItem.Product == null || !cartItem.Product.IsActive)
                {
                    return BadRequest("One or more products are no longer available.");
                }

                if (cartItem.Quantity > cartItem.Product.StockQuantity)
                {
                    return BadRequest($"Insufficient stock for {cartItem.Product.Name}.");
                }
            }

            var hasApliiqItems = cart.CartItems.Any(ci =>
                ci.Product != null &&
                ci.Product.IsFulfillmentEnabled &&
                string.Equals(ci.Product.FulfillmentProvider, "Apliiq", StringComparison.OrdinalIgnoreCase));

            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                foreach (var cartItem in cart.CartItems)
                {
                    if (cartItem.Product != null)
                    {
                        cartItem.Product.StockQuantity -= cartItem.Quantity;
                        cartItem.Product.UpdatedAt = DateTime.UtcNow;
                    }
                }

                _context.CartItems.RemoveRange(cart.CartItems);

                order.Payment.Status = "Paid";
                order.Payment.PaidAt = DateTime.UtcNow;

                order.Status = hasApliiqItems ? "SubmittingToFulfillment" : "Pending";
                order.UpdatedAt = DateTime.UtcNow;

                if (order.FulfillmentOrder != null)
                {
                    order.FulfillmentOrder.FulfillmentStatus = hasApliiqItems ? "Submitting" : "Pending";
                    order.FulfillmentOrder.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                if (hasApliiqItems)
                {
                    var apliiqResult = await _apliiqService.SubmitOrderAsync(order);

                    order.FulfillmentOrder!.ProviderOrderId = apliiqResult.ProviderOrderId;
                    order.FulfillmentOrder.SubmittedAt = DateTime.UtcNow;
                    order.FulfillmentOrder.UpdatedAt = DateTime.UtcNow;

                    if (apliiqResult.Success)
                    {
                        order.FulfillmentOrder.FulfillmentStatus =
                            apliiqResult.AcceptedButPending ? "AcceptedPendingReview" : "Submitted";

                        order.Status =
                            apliiqResult.AcceptedButPending ? "FulfillmentPendingReview" : "SubmittedToFulfillment";
                    }
                    else
                    {
                        order.FulfillmentOrder.FulfillmentStatus = "SubmissionFailed";
                        order.Status = "FulfillmentSubmissionFailed";
                    }

                    order.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }

                await transaction.CommitAsync();

                return Ok(new
                {
                    order.OrderId,
                    order.OrderNumber,
                    order.TotalAmount,
                    order.Status
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new
                {
                    message = "Failed to finalize PayPal checkout.",
                    detail = ex.Message
                });
            }
        }

        private static decimal CalculateSubtotal(IEnumerable<CartItem> cartItems)
        {
            decimal subtotal = 0m;

            foreach (var cartItem in cartItems)
            {
                var baseLineTotal = cartItem.UnitPrice * cartItem.Quantity;
                var sizeSurcharge = CalculateSizeSurcharge(cartItem.SizeSelected) * cartItem.Quantity;
                subtotal += baseLineTotal + sizeSurcharge;
            }

            return subtotal;
        }

        private static decimal CalculateSizeSurcharge(string? sizeSelected)
        {
            var normalized = (sizeSelected ?? string.Empty).Trim().ToUpperInvariant();

            return normalized switch
            {
                "XXL" => 2.00m,
                "XXXL" => 3.00m,
                _ => 0m
            };
        }

        private static decimal CalculateShippingAmount(int totalItemCount, decimal subtotalBeforeShipping)
        {
            if (subtotalBeforeShipping >= 500m)
            {
                return 0m;
            }

            if (totalItemCount <= 0)
            {
                return 0m;
            }

            if (totalItemCount == 1)
            {
                return 6.65m;
            }

            return 6.65m + (decimal)Math.Floor(totalItemCount / 2.0) * 3.30m;
        }

        private async Task<string> CreatePayPalOrderWithProvider(Order order)
        {
            var accessToken = await GetPayPalAccessToken();

            using var client = new HttpClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            var payload = new
            {
                intent = "CAPTURE",
                purchase_units = new[]
                {
                    new
                    {
                        reference_id = order.OrderNumber,
                        amount = new
                        {
                            currency_code = "USD",
                            value = order.TotalAmount.ToString("0.00")
                        }
                    }
                }
            };

            var content = new StringContent(
                JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json");

            var response = await client.PostAsync(GetPayPalBaseUrl() + "/v2/checkout/orders", content);
            var raw = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"PayPal create order failed: {raw}");
            }

            using var doc = JsonDocument.Parse(raw);
            return doc.RootElement.GetProperty("id").GetString()
                   ?? throw new Exception("PayPal order id missing.");
        }

        private async Task<bool> CapturePayPalOrderWithProvider(string payPalOrderId)
        {
            var accessToken = await GetPayPalAccessToken();

            using var client = new HttpClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            var content = new StringContent("{}", Encoding.UTF8, "application/json");
            var response = await client.PostAsync(GetPayPalBaseUrl() + $"/v2/checkout/orders/{payPalOrderId}/capture", content);
            var raw = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                return false;
            }

            using var doc = JsonDocument.Parse(raw);
            var status = doc.RootElement.GetProperty("status").GetString();

            return string.Equals(status, "COMPLETED", StringComparison.OrdinalIgnoreCase);
        }

        private async Task<string> GetPayPalAccessToken()
        {
            var clientId = _configuration["PayPal:ClientId"];
            var clientSecret = _configuration["PayPal:ClientSecret"];

            if (string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(clientSecret))
            {
                throw new Exception("PayPal credentials are not configured.");
            }

            using var client = new HttpClient();

            var auth = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{clientId}:{clientSecret}"));
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", auth);

            var content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["grant_type"] = "client_credentials"
            });

            var response = await client.PostAsync(GetPayPalBaseUrl() + "/v1/oauth2/token", content);
            var raw = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"PayPal token request failed: {raw}");
            }

            using var doc = JsonDocument.Parse(raw);
            return doc.RootElement.GetProperty("access_token").GetString()
                   ?? throw new Exception("PayPal access token missing.");
        }

        private string GetPayPalBaseUrl()
        {
            return _configuration["PayPal:BaseUrl"] ?? "https://api-m.sandbox.paypal.com";
        }

        private int? GetAuthenticatedUserId()
        {
            var claimValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!int.TryParse(claimValue, out var userId))
            {
                return null;
            }

            return userId;
        }

        public class CapturePayPalOrderRequest
        {
            public int OrderId { get; set; }
            public string PayPalOrderId { get; set; } = string.Empty;
        }
    }
}