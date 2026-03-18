using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StoreApi.Data;
using StoreApi.Models;

namespace StoreApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CartItemController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CartItemController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetCartItems()
        {
            var cartItems = await _context.CartItems
                .Include(ci => ci.Cart)
                .Include(ci => ci.Product)
                .OrderBy(ci => ci.CartId)
                .ToListAsync();

            return Ok(cartItems);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCartItem(int id)
        {
            var cartItem = await _context.CartItems
                .Include(ci => ci.Cart)
                .Include(ci => ci.Product)
                .FirstOrDefaultAsync(ci => ci.CartItemId == id);

            if (cartItem == null)
            {
                return NotFound();
            }

            return Ok(cartItem);
        }

        [HttpPost]
        public async Task<IActionResult> CreateCartItem(CartItem cartItem)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var cartExists = await _context.Carts
                .AnyAsync(c => c.CartId == cartItem.CartId);

            if (!cartExists)
            {
                return BadRequest("Invalid CartId.");
            }

            var productExists = await _context.Products
                .AnyAsync(p => p.ProductId == cartItem.ProductId);

            if (!productExists)
            {
                return BadRequest("Invalid ProductId.");
            }

            _context.CartItems.Add(cartItem);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCartItem), new { id = cartItem.CartItemId }, cartItem);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCartItem(int id, CartItem updatedCartItem)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != updatedCartItem.CartItemId)
            {
                return BadRequest("CartItem ID mismatch.");
            }

            var existingCartItem = await _context.CartItems.FindAsync(id);

            if (existingCartItem == null)
            {
                return NotFound();
            }

            var cartExists = await _context.Carts
                .AnyAsync(c => c.CartId == updatedCartItem.CartId);

            if (!cartExists)
            {
                return BadRequest("Invalid CartId.");
            }

            var productExists = await _context.Products
                .AnyAsync(p => p.ProductId == updatedCartItem.ProductId);

            if (!productExists)
            {
                return BadRequest("Invalid ProductId.");
            }

            existingCartItem.CartId = updatedCartItem.CartId;
            existingCartItem.ProductId = updatedCartItem.ProductId;
            existingCartItem.Quantity = updatedCartItem.Quantity;
            existingCartItem.UnitPrice = updatedCartItem.UnitPrice;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCartItem(int id)
        {
            var cartItem = await _context.CartItems.FindAsync(id);

            if (cartItem == null)
            {
                return NotFound();
            }

            _context.CartItems.Remove(cartItem);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}