using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StoreApi.Data;
using StoreAPI.Models;

namespace StoreApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FulfillmentOrderController : ControllerBase
    {
        private readonly AppDbContext _context;

        public FulfillmentOrderController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetFulfillmentOrders()
        {
            var fulfillmentOrders = await _context.FulfillmentOrders
                .Include(fo => fo.Order)
                .OrderByDescending(fo => fo.UpdatedAt)
                .ToListAsync();

            return Ok(fulfillmentOrders);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetFulfillmentOrder(int id)
        {
            var fulfillmentOrder = await _context.FulfillmentOrders
                .Include(fo => fo.Order)
                .FirstOrDefaultAsync(fo => fo.FulfillmentOrderId == id);

            if (fulfillmentOrder == null)
            {
                return NotFound();
            }

            return Ok(fulfillmentOrder);
        }

        [HttpPost]
        public async Task<IActionResult> CreateFulfillmentOrder(FulfillmentOrder fulfillmentOrder)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var orderExists = await _context.Orders
                .AnyAsync(o => o.OrderId == fulfillmentOrder.OrderId);

            if (!orderExists)
            {
                return BadRequest("Invalid OrderId.");
            }

            fulfillmentOrder.UpdatedAt = DateTime.UtcNow;

            _context.FulfillmentOrders.Add(fulfillmentOrder);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetFulfillmentOrder), new { id = fulfillmentOrder.FulfillmentOrderId }, fulfillmentOrder);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateFulfillmentOrder(int id, FulfillmentOrder updatedFulfillmentOrder)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != updatedFulfillmentOrder.FulfillmentOrderId)
            {
                return BadRequest("FulfillmentOrder ID mismatch.");
            }

            var existingFulfillmentOrder = await _context.FulfillmentOrders.FindAsync(id);

            if (existingFulfillmentOrder == null)
            {
                return NotFound();
            }

            var orderExists = await _context.Orders
                .AnyAsync(o => o.OrderId == updatedFulfillmentOrder.OrderId);

            if (!orderExists)
            {
                return BadRequest("Invalid OrderId.");
            }

            existingFulfillmentOrder.OrderId = updatedFulfillmentOrder.OrderId;
            existingFulfillmentOrder.Provider = updatedFulfillmentOrder.Provider;
            existingFulfillmentOrder.ProviderOrderId = updatedFulfillmentOrder.ProviderOrderId;
            existingFulfillmentOrder.FulfillmentStatus = updatedFulfillmentOrder.FulfillmentStatus;
            existingFulfillmentOrder.TrackingNumber = updatedFulfillmentOrder.TrackingNumber;
            existingFulfillmentOrder.TrackingUrl = updatedFulfillmentOrder.TrackingUrl;
            existingFulfillmentOrder.SubmittedAt = updatedFulfillmentOrder.SubmittedAt;
            existingFulfillmentOrder.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFulfillmentOrder(int id)
        {
            var fulfillmentOrder = await _context.FulfillmentOrders.FindAsync(id);

            if (fulfillmentOrder == null)
            {
                return NotFound();
            }

            _context.FulfillmentOrders.Remove(fulfillmentOrder);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}