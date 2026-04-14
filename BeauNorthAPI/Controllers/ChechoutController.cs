using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BeauNorthApi.Data;
using BeauNorthAPI.DTOs.Checkout;
using BeauNorthAPI.Models;
using System.Security.Claims;

namespace BeauNorthAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CheckoutController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CheckoutController(AppDbContext context)
        {
            _context = context;
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

            var subtotal = cart.CartItems.Sum(ci => ci.UnitPrice * ci.Quantity);
            var taxAmount = Math.Round(subtotal * 0.06m, 2);
            var shippingAmount = subtotal >= 100 ? 0 : 8.99m;
            var totalAmount = subtotal + taxAmount + shippingAmount;

            var order = new Order
            {
                UserId = userId.Value,
                OrderNumber = $"ORD-{DateTime.UtcNow:yyyyMMddHHmmssfff}",
                Status = "Pending",
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
                Status = "Pending",
                Amount = totalAmount,
                PaidAt = null
            };

            _context.Payments.Add(payment);

            var fulfillment = new FulfillmentOrder
            {
                OrderId = order.OrderId,
                Provider = "Manual",
                ProviderOrderId = null,
                FulfillmentStatus = "Pending",
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
                }
            }

            _context.CartItems.RemoveRange(cart.CartItems);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                order.OrderId,
                order.OrderNumber,
                order.TotalAmount,
                order.Status
            });
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
    }
}