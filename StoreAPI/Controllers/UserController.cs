using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StoreApi.Data;
using StoreAPI.DTOs.Users;
using System.Security.Claims;

namespace StoreAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UserController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMyAccount()
        {
            var userId = GetAuthenticatedUserId();
            if (userId == null)
            {
                return Unauthorized();
            }

            var user = await _context.Users
                .Where(u => u.UserId == userId.Value && !u.IsDeleted)
                .Select(u => new UserResponseDto
                {
                    UserId = u.UserId,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    Email = u.Email,
                    Role = u.Role
                })
                .FirstOrDefaultAsync();

            if (user == null)
            {
                return NotFound();
            }

            return Ok(user);
        }

        [HttpPut("me")]
        public async Task<IActionResult> UpdateMyAccount(UpdateAccountDto request)
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

            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId.Value && !u.IsDeleted);

            if (user == null)
            {
                return NotFound();
            }

            var normalizedEmail = request.Email.Trim().ToLower();

            var emailTaken = await _context.Users.AnyAsync(u =>
                u.Email == normalizedEmail &&
                u.UserId != user.UserId &&
                !u.IsDeleted);

            if (emailTaken)
            {
                return BadRequest("That email is already in use.");
            }

            user.FirstName = request.FirstName.Trim();
            user.LastName = request.LastName.Trim();
            user.Email = normalizedEmail;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("me")]
        public async Task<IActionResult> DeleteMyAccount()
        {
            var userId = GetAuthenticatedUserId();
            if (userId == null)
            {
                return Unauthorized();
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId.Value && !u.IsDeleted);

            if (user == null)
            {
                return NotFound();
            }

            user.FirstName = "Deleted";
            user.LastName = "User";
            user.Email = $"deleted_{user.UserId}@deleted.local";
            user.PasswordHash = Guid.NewGuid().ToString();
            user.Role = "Deleted";
            user.IsDeleted = true;
            user.DeletedAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;

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
    }
}