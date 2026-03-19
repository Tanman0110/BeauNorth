using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StoreApi.Data;
using StoreAPI.Models;

namespace StoreApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CartController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CartController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetCarts()
        {
            var carts = await _context.Carts
                .Include(c => c.User)
                .Include(c => c.CartItems)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            return Ok(carts);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCart(int id)
        {
            var cart = await _context.Carts
                .Include(c => c.User)
                .Include(c => c.CartItems)
                    .ThenInclude(ci => ci.Product)
                .FirstOrDefaultAsync(c => c.CartId == id);

            if (cart == null)
            {
                return NotFound();
            }

            return Ok(cart);
        }

        [HttpPost]
        public async Task<IActionResult> CreateCart(Cart cart)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userExists = await _context.Users
                .AnyAsync(u => u.UserId == cart.UserId);

            if (!userExists)
            {
                return BadRequest("Invalid UserId.");
            }

            cart.CreatedAt = DateTime.UtcNow;
            cart.UpdatedAt = DateTime.UtcNow;

            _context.Carts.Add(cart);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCart), new { id = cart.CartId }, cart);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCart(int id, Cart updatedCart)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != updatedCart.CartId)
            {
                return BadRequest("Cart ID mismatch.");
            }

            var existingCart = await _context.Carts.FindAsync(id);

            if (existingCart == null)
            {
                return NotFound();
            }

            var userExists = await _context.Users
                .AnyAsync(u => u.UserId == updatedCart.UserId);

            if (!userExists)
            {
                return BadRequest("Invalid UserId.");
            }

            existingCart.UserId = updatedCart.UserId;
            existingCart.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCart(int id)
        {
            var cart = await _context.Carts.FindAsync(id);

            if (cart == null)
            {
                return NotFound();
            }

            _context.Carts.Remove(cart);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}