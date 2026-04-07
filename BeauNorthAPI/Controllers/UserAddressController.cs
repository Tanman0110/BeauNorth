using BeauNorthApi.Data;
using BeauNorthAPI.DTOs.Users;
using BeauNorthAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BeauNorthAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserAddressController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UserAddressController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMyAddresses()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var addresses = await _context.UserAddresses
                .Where(a => a.UserId == userId.Value)
                .OrderByDescending(a => a.IsDefault)
                .ThenByDescending(a => a.CreatedAt)
                .ToListAsync();

            return Ok(addresses);
        }

        [HttpPost("me")]
        public async Task<IActionResult> CreateMyAddress(CreateUserAddressDto request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            if (request.IsDefault)
            {
                var existingDefaults = await _context.UserAddresses
                    .Where(a => a.UserId == userId.Value && a.IsDefault)
                    .ToListAsync();

                foreach (var address in existingDefaults)
                {
                    address.IsDefault = false;
                }
            }

            var addressEntity = new UserAddress
            {
                UserId = userId.Value,
                FullName = request.FullName.Trim(),
                AddressLine1 = request.AddressLine1.Trim(),
                AddressLine2 = request.AddressLine2?.Trim(),
                City = request.City.Trim(),
                State = request.State.Trim(),
                PostalCode = request.PostalCode.Trim(),
                Country = request.Country.Trim(),
                IsDefault = request.IsDefault,
                CreatedAt = DateTime.UtcNow
            };

            _context.UserAddresses.Add(addressEntity);
            await _context.SaveChangesAsync();

            return Ok(addressEntity);
        }

        [HttpPut("me/{id}")]
        public async Task<IActionResult> UpdateMyAddress(int id, UpdateUserAddressDto request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var address = await _context.UserAddresses
                .FirstOrDefaultAsync(a => a.UserAddressId == id && a.UserId == userId.Value);

            if (address == null) return NotFound();

            if (request.IsDefault)
            {
                var existingDefaults = await _context.UserAddresses
                    .Where(a => a.UserId == userId.Value && a.IsDefault && a.UserAddressId != id)
                    .ToListAsync();

                foreach (var item in existingDefaults)
                {
                    item.IsDefault = false;
                }
            }

            address.FullName = request.FullName.Trim();
            address.AddressLine1 = request.AddressLine1.Trim();
            address.AddressLine2 = request.AddressLine2?.Trim();
            address.City = request.City.Trim();
            address.State = request.State.Trim();
            address.PostalCode = request.PostalCode.Trim();
            address.Country = request.Country.Trim();
            address.IsDefault = request.IsDefault;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("me/{id}")]
        public async Task<IActionResult> DeleteMyAddress(int id)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var address = await _context.UserAddresses
                .FirstOrDefaultAsync(a => a.UserAddressId == id && a.UserId == userId.Value);

            if (address == null) return NotFound();

            _context.UserAddresses.Remove(address);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private int? GetUserId()
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