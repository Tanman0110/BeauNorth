using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BeauNorthApi.Data;
using BeauNorthAPI.Models;

namespace BeauNorthApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ShippingAddressController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ShippingAddressController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetShippingAddresses()
        {
            var shippingAddresses = await _context.ShippingAddresses
                .Include(sa => sa.Order)
                .OrderBy(sa => sa.FullName)
                .ToListAsync();

            return Ok(shippingAddresses);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetShippingAddress(int id)
        {
            var shippingAddress = await _context.ShippingAddresses
                .Include(sa => sa.Order)
                .FirstOrDefaultAsync(sa => sa.ShippingAddressId == id);

            if (shippingAddress == null)
            {
                return NotFound();
            }

            return Ok(shippingAddress);
        }

        [HttpPost]
        public async Task<IActionResult> CreateShippingAddress(ShippingAddress shippingAddress)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var orderExists = await _context.Orders
                .AnyAsync(o => o.OrderId == shippingAddress.OrderId);

            if (!orderExists)
            {
                return BadRequest("Invalid OrderId.");
            }

            _context.ShippingAddresses.Add(shippingAddress);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetShippingAddress), new { id = shippingAddress.ShippingAddressId }, shippingAddress);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateShippingAddress(int id, ShippingAddress updatedShippingAddress)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != updatedShippingAddress.ShippingAddressId)
            {
                return BadRequest("ShippingAddress ID mismatch.");
            }

            var existingShippingAddress = await _context.ShippingAddresses.FindAsync(id);

            if (existingShippingAddress == null)
            {
                return NotFound();
            }

            var orderExists = await _context.Orders
                .AnyAsync(o => o.OrderId == updatedShippingAddress.OrderId);

            if (!orderExists)
            {
                return BadRequest("Invalid OrderId.");
            }

            existingShippingAddress.OrderId = updatedShippingAddress.OrderId;
            existingShippingAddress.FullName = updatedShippingAddress.FullName;
            existingShippingAddress.AddressLine1 = updatedShippingAddress.AddressLine1;
            existingShippingAddress.AddressLine2 = updatedShippingAddress.AddressLine2;
            existingShippingAddress.City = updatedShippingAddress.City;
            existingShippingAddress.State = updatedShippingAddress.State;
            existingShippingAddress.PostalCode = updatedShippingAddress.PostalCode;
            existingShippingAddress.Country = updatedShippingAddress.Country;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteShippingAddress(int id)
        {
            var shippingAddress = await _context.ShippingAddresses.FindAsync(id);

            if (shippingAddress == null)
            {
                return NotFound();
            }

            _context.ShippingAddresses.Remove(shippingAddress);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}