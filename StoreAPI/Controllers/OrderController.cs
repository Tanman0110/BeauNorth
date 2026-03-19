using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StoreApi.Data;
using System.Security.Claims;

namespace StoreAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class OrderController : ControllerBase
    {
        private readonly AppDbContext _context;

        public OrderController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMyOrders()
        {
            var userId = GetAuthenticatedUserId();
            if (userId == null)
            {
                return Unauthorized();
            }

            var orders = await _context.Orders
                .Where(o => o.UserId == userId.Value)
                .Include(o => o.OrderItems)
                .Include(o => o.ShippingAddress)
                .Include(o => o.Payment)
                .Include(o => o.FulfillmentOrder)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

            return Ok(orders);
        }

        [HttpGet("me/{id}")]
        public async Task<IActionResult> GetMyOrderById(int id)
        {
            var userId = GetAuthenticatedUserId();
            if (userId == null)
            {
                return Unauthorized();
            }

            var order = await _context.Orders
                .Where(o => o.OrderId == id && o.UserId == userId.Value)
                .Include(o => o.OrderItems)
                .Include(o => o.ShippingAddress)
                .Include(o => o.Payment)
                .Include(o => o.FulfillmentOrder)
                .FirstOrDefaultAsync();

            if (order == null)
            {
                return NotFound();
            }

            return Ok(order);
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