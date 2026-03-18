using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StoreApi.Data;
using StoreApi.Models;

namespace StoreApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrderController : ControllerBase
    {
        private readonly AppDbContext _context;

        public OrderController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetOrders()
        {
            var orders = await _context.Orders
                .Include(o => o.User)
                .Include(o => o.OrderItems)
                .Include(o => o.ShippingAddress)
                .Include(o => o.Payment)
                .Include(o => o.FulfillmentOrder)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

            return Ok(orders);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetOrder(int id)
        {
            var order = await _context.Orders
                .Include(o => o.User)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .Include(o => o.ShippingAddress)
                .Include(o => o.Payment)
                .Include(o => o.FulfillmentOrder)
                .FirstOrDefaultAsync(o => o.OrderId == id);

            if (order == null)
            {
                return NotFound();
            }

            return Ok(order);
        }

        [HttpPost]
        public async Task<IActionResult> CreateOrder(Order order)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userExists = await _context.Users
                .AnyAsync(u => u.UserId == order.UserId);

            if (!userExists)
            {
                return BadRequest("Invalid UserId.");
            }

            order.CreatedAt = DateTime.UtcNow;
            order.UpdatedAt = DateTime.UtcNow;

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetOrder), new { id = order.OrderId }, order);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateOrder(int id, Order updatedOrder)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != updatedOrder.OrderId)
            {
                return BadRequest("Order ID mismatch.");
            }

            var existingOrder = await _context.Orders.FindAsync(id);

            if (existingOrder == null)
            {
                return NotFound();
            }

            var userExists = await _context.Users
                .AnyAsync(u => u.UserId == updatedOrder.UserId);

            if (!userExists)
            {
                return BadRequest("Invalid UserId.");
            }

            existingOrder.UserId = updatedOrder.UserId;
            existingOrder.OrderNumber = updatedOrder.OrderNumber;
            existingOrder.Status = updatedOrder.Status;
            existingOrder.Subtotal = updatedOrder.Subtotal;
            existingOrder.TaxAmount = updatedOrder.TaxAmount;
            existingOrder.ShippingAmount = updatedOrder.ShippingAmount;
            existingOrder.TotalAmount = updatedOrder.TotalAmount;
            existingOrder.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOrder(int id)
        {
            var order = await _context.Orders.FindAsync(id);

            if (order == null)
            {
                return NotFound();
            }

            _context.Orders.Remove(order);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}