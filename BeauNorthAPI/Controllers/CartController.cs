using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BeauNorthApi.Data;
using BeauNorthAPI.DTOs.Cart;
using BeauNorthAPI.Models;
using System.Security.Claims;

namespace BeauNorthAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CartController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CartController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMyCart()
        {
            var userId = GetAuthenticatedUserId();
            if (userId == null)
            {
                return Unauthorized();
            }

            var cart = await GetOrCreateCart(userId.Value);

            var fullCart = await _context.Carts
                .Include(c => c.CartItems)
                    .ThenInclude(ci => ci.Product!)
                        .ThenInclude(p => p.ProductImages)
                .FirstOrDefaultAsync(c => c.CartId == cart.CartId);

            return Ok(fullCart);
        }

        [HttpPost("items")]
        public async Task<IActionResult> AddItemToCart(AddCartItemDto request)
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

            var product = await _context.Products.FirstOrDefaultAsync(p =>
                p.ProductId == request.ProductId &&
                p.IsActive);

            if (product == null)
            {
                return BadRequest("Invalid ProductId.");
            }

            if (request.Quantity > product.StockQuantity)
            {
                return BadRequest("Requested quantity exceeds stock.");
            }

            var cart = await GetOrCreateCart(userId.Value);

            var existingCartItem = await _context.CartItems.FirstOrDefaultAsync(ci =>
                ci.CartId == cart.CartId &&
                ci.ProductId == request.ProductId &&
                ci.SizeSelected == request.SizeSelected &&
                ci.ColorSelected == request.ColorSelected);

            if (existingCartItem != null)
            {
                var newQuantity = existingCartItem.Quantity + request.Quantity;

                if (newQuantity > product.StockQuantity)
                {
                    return BadRequest("Requested quantity exceeds stock.");
                }

                existingCartItem.Quantity = newQuantity;
                existingCartItem.UnitPrice = product.Price;
            }
            else
            {
                var cartItem = new CartItem
                {
                    CartId = cart.CartId,
                    ProductId = product.ProductId,
                    Quantity = request.Quantity,
                    UnitPrice = product.Price,
                    SizeSelected = request.SizeSelected?.Trim(),
                    ColorSelected = request.ColorSelected?.Trim()
                };

                _context.CartItems.Add(cartItem);
            }

            cart.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPut("items/{cartItemId}")]
        public async Task<IActionResult> UpdateCartItem(int cartItemId, UpdateCartItemDto request)
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

            var cartItem = await _context.CartItems
                .Include(ci => ci.Cart)
                .Include(ci => ci.Product)
                .FirstOrDefaultAsync(ci => ci.CartItemId == cartItemId);

            if (cartItem == null)
            {
                return NotFound();
            }

            if (cartItem.Cart == null || cartItem.Cart.UserId != userId.Value)
            {
                return Forbid();
            }

            if (cartItem.Product == null)
            {
                return BadRequest("Product not found.");
            }

            if (request.Quantity > cartItem.Product.StockQuantity)
            {
                return BadRequest("Requested quantity exceeds stock.");
            }

            cartItem.Quantity = request.Quantity;
            cartItem.UnitPrice = cartItem.Product.Price;
            cartItem.Cart.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("items/{cartItemId}")]
        public async Task<IActionResult> RemoveCartItem(int cartItemId)
        {
            var userId = GetAuthenticatedUserId();
            if (userId == null)
            {
                return Unauthorized();
            }

            var cartItem = await _context.CartItems
                .Include(ci => ci.Cart)
                .FirstOrDefaultAsync(ci => ci.CartItemId == cartItemId);

            if (cartItem == null)
            {
                return NotFound();
            }

            if (cartItem.Cart == null || cartItem.Cart.UserId != userId.Value)
            {
                return Forbid();
            }

            cartItem.Cart.UpdatedAt = DateTime.UtcNow;
            _context.CartItems.Remove(cartItem);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("me")]
        public async Task<IActionResult> ClearMyCart()
        {
            var userId = GetAuthenticatedUserId();
            if (userId == null)
            {
                return Unauthorized();
            }

            var cart = await _context.Carts
                .Include(c => c.CartItems)
                .FirstOrDefaultAsync(c => c.UserId == userId.Value);

            if (cart == null)
            {
                return NoContent();
            }

            _context.CartItems.RemoveRange(cart.CartItems);
            cart.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return NoContent();
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

        private async Task<Cart> GetOrCreateCart(int userId)
        {
            var cart = await _context.Carts.FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart != null)
            {
                return cart;
            }

            cart = new Cart
            {
                UserId = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Carts.Add(cart);
            await _context.SaveChangesAsync();

            return cart;
        }
    }
}