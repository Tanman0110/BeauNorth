using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StoreApi.Data;
using StoreAPI.Models;

namespace StoreApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrderItemController : ControllerBase
    {
        private readonly AppDbContext _context;

        public OrderItemController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetOrderItems()
        {
            var orderItems = await _context.OrderItems
                .Include(oi => oi.Order)
                .Include(oi => oi.Product)
                .OrderBy(oi => oi.OrderId)
                .ToListAsync();

            return Ok(orderItems);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetOrderItem(int id)
        {
            var orderItem = await _context.OrderItems
                .Include(oi => oi.Order)
                .Include(oi => oi.Product)
                .FirstOrDefaultAsync(oi => oi.OrderItemId == id);

            if (orderItem == null)
            {
                return NotFound();
            }

            return Ok(orderItem);
        }

        [HttpPost]
        public async Task<IActionResult> CreateOrderItem(OrderItem orderItem)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var orderExists = await _context.Orders
                .AnyAsync(o => o.OrderId == orderItem.OrderId);

            if (!orderExists)
            {
                return BadRequest("Invalid OrderId.");
            }

            var productExists = await _context.Products
                .AnyAsync(p => p.ProductId == orderItem.ProductId);

            if (!productExists)
            {
                return BadRequest("Invalid ProductId.");
            }

            _context.OrderItems.Add(orderItem);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetOrderItem), new { id = orderItem.OrderItemId }, orderItem);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateOrderItem(int id, OrderItem updatedOrderItem)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != updatedOrderItem.OrderItemId)
            {
                return BadRequest("OrderItem ID mismatch.");
            }

            var existingOrderItem = await _context.OrderItems.FindAsync(id);

            if (existingOrderItem == null)
            {
                return NotFound();
            }

            var orderExists = await _context.Orders
                .AnyAsync(o => o.OrderId == updatedOrderItem.OrderId);

            if (!orderExists)
            {
                return BadRequest("Invalid OrderId.");
            }

            var productExists = await _context.Products
                .AnyAsync(p => p.ProductId == updatedOrderItem.ProductId);

            if (!productExists)
            {
                return BadRequest("Invalid ProductId.");
            }

            existingOrderItem.OrderId = updatedOrderItem.OrderId;
            existingOrderItem.ProductId = updatedOrderItem.ProductId;
            existingOrderItem.Quantity = updatedOrderItem.Quantity;
            existingOrderItem.UnitPrice = updatedOrderItem.UnitPrice;
            existingOrderItem.ProductNameSnapshot = updatedOrderItem.ProductNameSnapshot;
            existingOrderItem.ProductSkuSnapshot = updatedOrderItem.ProductSkuSnapshot;
            existingOrderItem.SizeSelected = updatedOrderItem.SizeSelected;
            existingOrderItem.ColorSelected = updatedOrderItem.ColorSelected;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOrderItem(int id)
        {
            var orderItem = await _context.OrderItems.FindAsync(id);

            if (orderItem == null)
            {
                return NotFound();
            }

            _context.OrderItems.Remove(orderItem);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}