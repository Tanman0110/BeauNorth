using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace BeauNorthAPI.Models
{
    public class User
    {
        public int UserId { get; set; }

        [Required]
        [MaxLength(100)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [MaxLength(255)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        [JsonIgnore]
        public string PasswordHash { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Role { get; set; } = "Customer";

        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; }

        public int FailedLoginAttempts { get; set; } = 0;
        public DateTime? LastFailedLoginAtUtc { get; set; }
        public DateTime? LockoutEndUtc { get; set; }

        [MaxLength(200)]
        public string? PasswordResetToken { get; set; }
        public DateTime? PasswordResetTokenExpiresAtUtc { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [JsonIgnore]
        public ICollection<Order> Orders { get; set; } = new List<Order>();

        [JsonIgnore]
        public ICollection<Cart> Carts { get; set; } = new List<Cart>();

        [JsonIgnore]
        public ICollection<UserAddress> UserAddresses { get; set; } = new List<UserAddress>();
    }
}