using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using StoreApi.Data;
using StoreAPI.DTOs.Auth;
using StoreAPI.Models;
using StoreAPI.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace StoreAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;

        public AuthController(
            AppDbContext context,
            IConfiguration configuration,
            IEmailService emailService)
        {
            _context = context;
            _configuration = configuration;
            _emailService = emailService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var firstName = request.FirstName.Trim();
            var lastName = request.LastName.Trim();
            var email = request.Email.Trim().ToLower();

            var reservedWords = new[] { "admin", "root", "system", "null", "owner", "support" };

            if (reservedWords.Contains(firstName.ToLower()) || reservedWords.Contains(lastName.ToLower()))
            {
                return BadRequest("That name is not allowed.");
            }

            var emailExists = await _context.Users.AnyAsync(u => u.Email == email);
            if (emailExists)
            {
                return BadRequest("An account with that email already exists.");
            }

            var user = new User
            {
                FirstName = firstName,
                LastName = lastName,
                Email = email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Role = "Customer",
                IsDeleted = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var token = GenerateJwtToken(user);

            return Ok(new AuthResponseDto
            {
                Token = token,
                UserId = user.UserId,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                Role = user.Role
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var email = request.Email.Trim().ToLower();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

            if (user == null || user.IsDeleted)
            {
                return Unauthorized("Invalid email or password.");
            }

            ResetFailedAttemptsIfWindowExpired(user);

            if (user.LockoutEndUtc.HasValue && user.LockoutEndUtc.Value > DateTime.UtcNow)
            {
                return Unauthorized("Your account is locked. Please reset your password or try again later.");
            }

            var passwordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);

            if (!passwordValid)
            {
                user.FailedLoginAttempts += 1;
                user.LastFailedLoginAtUtc = DateTime.UtcNow;
                user.UpdatedAt = DateTime.UtcNow;

                if (user.FailedLoginAttempts >= 5)
                {
                    user.LockoutEndUtc = DateTime.UtcNow.AddHours(1);
                    user.FailedLoginAttempts = 5;

                    await SendAccountLockedEmailAsync(user);
                }

                await _context.SaveChangesAsync();
                return Unauthorized("Invalid email or password.");
            }

            user.FailedLoginAttempts = 0;
            user.LastFailedLoginAtUtc = null;
            user.LockoutEndUtc = null;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var token = GenerateJwtToken(user);

            return Ok(new AuthResponseDto
            {
                Token = token,
                UserId = user.UserId,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                Role = user.Role
            });
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword(ForgotPasswordRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var email = request.Email.Trim().ToLower();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email && !u.IsDeleted);

            if (user == null)
            {
                return Ok(new { message = "If that email exists, a reset link has been sent." });
            }

            var token = GenerateSecureToken();

            user.PasswordResetToken = token;
            user.PasswordResetTokenExpiresAtUtc = DateTime.UtcNow.AddHours(1);
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var frontendBaseUrl = _configuration["Frontend:BaseUrl"] ?? "http://localhost:63146";
            var resetLink = $"{frontendBaseUrl}/reset-password?token={Uri.EscapeDataString(token)}";

            await _emailService.SendEmailAsync(
                user.Email,
                "Reset your password",
                $"Use this link to reset your password: {resetLink}"
            );

            return Ok(new { message = "If that email exists, a reset link has been sent." });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(ResetPasswordRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await _context.Users.FirstOrDefaultAsync(u =>
                u.PasswordResetToken == request.Token &&
                u.PasswordResetTokenExpiresAtUtc.HasValue &&
                u.PasswordResetTokenExpiresAtUtc.Value > DateTime.UtcNow &&
                !u.IsDeleted);

            if (user == null)
            {
                return BadRequest("Invalid or expired reset token.");
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.PasswordResetToken = null;
            user.PasswordResetTokenExpiresAtUtc = null;
            user.FailedLoginAttempts = 0;
            user.LastFailedLoginAtUtc = null;
            user.LockoutEndUtc = null;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Password reset successfully." });
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId && !u.IsDeleted);

            if (user == null)
            {
                return NotFound();
            }

            return Ok(new
            {
                user.UserId,
                user.FirstName,
                user.LastName,
                user.Email,
                user.Role
            });
        }

        private void ResetFailedAttemptsIfWindowExpired(User user)
        {
            if (
                user.FailedLoginAttempts > 0 &&
                user.LastFailedLoginAtUtc.HasValue &&
                user.LastFailedLoginAtUtc.Value <= DateTime.UtcNow.AddHours(-1))
            {
                user.FailedLoginAttempts = 0;
                user.LastFailedLoginAtUtc = null;

                if (user.LockoutEndUtc.HasValue && user.LockoutEndUtc.Value <= DateTime.UtcNow)
                {
                    user.LockoutEndUtc = null;
                }
            }
        }

        private async Task SendAccountLockedEmailAsync(User user)
        {
            var token = GenerateSecureToken();

            user.PasswordResetToken = token;
            user.PasswordResetTokenExpiresAtUtc = DateTime.UtcNow.AddHours(1);

            var frontendBaseUrl = _configuration["Frontend:BaseUrl"] ?? "http://localhost:63146";
            var resetLink = $"{frontendBaseUrl}/reset-password?token={Uri.EscapeDataString(token)}";

            await _emailService.SendEmailAsync(
                user.Email,
                "Your account has been locked",
                $"Your account was locked due to too many unsuccessful login attempts. Reset your password here to unlock your account: {resetLink}"
            );
        }

        private string GenerateSecureToken()
        {
            var bytes = RandomNumberGenerator.GetBytes(32);
            return Convert.ToBase64String(bytes)
                .Replace("+", "-")
                .Replace("/", "_")
                .Replace("=", "");
        }

        private string GenerateJwtToken(User user)
        {
            var jwtSettings = _configuration.GetSection("Jwt");
            var issuer = jwtSettings["Issuer"];
            var audience = jwtSettings["Audience"];
            var key = jwtSettings["Key"] ?? throw new InvalidOperationException("JWT key not configured.");

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim(ClaimTypes.Name, $"{user.FirstName} {user.LastName}")
            };

            var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
            var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(12),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}