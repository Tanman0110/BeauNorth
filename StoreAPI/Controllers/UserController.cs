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
            var user = await GetAuthenticatedUserEntity();
            if (user == null)
            {
                return NotFound();
            }

            return Ok(new UserResponseDto
            {
                UserId = user.UserId,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                Role = user.Role
            });
        }

        [HttpPut("me")]
        public async Task<IActionResult> UpdateMyAccount(UpdateAccountDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await GetAuthenticatedUserEntity();
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

        [HttpPut("me/password")]
        public async Task<IActionResult> ChangePassword(ChangePasswordDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await GetAuthenticatedUserEntity();
            if (user == null)
            {
                return NotFound();
            }

            var currentPasswordValid = BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash);

            if (!currentPasswordValid)
            {
                return BadRequest("Current password is incorrect.");
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("me")]
        public async Task<IActionResult> DeleteMyAccount()
        {
            var user = await GetAuthenticatedUserEntity();
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

        private async Task<StoreAPI.Models.User?> GetAuthenticatedUserEntity()
        {
            var claimValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!int.TryParse(claimValue, out var userId))
            {
                return null;
            }

            return await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId && !u.IsDeleted);
        }
    }
}