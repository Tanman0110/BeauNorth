using System.ComponentModel.DataAnnotations;

namespace BeauNorthAPI.DTOs.Auth
{
    public class RegisterRequestDto
    {
        [Required]
        [MaxLength(100)]
        [RegularExpression(@"^[A-Za-z]+([ '\-][A-Za-z]+)*$", ErrorMessage = "First name contains invalid characters.")]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        [RegularExpression(@"^[A-Za-z]+([ '\-][A-Za-z]+)*$", ErrorMessage = "Last name contains invalid characters.")]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [MaxLength(255)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(8)]
        [RegularExpression(
            @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$",
            ErrorMessage = "Password must be at least 8 characters and include uppercase, lowercase, number, and a special character."
        )]
        public string Password { get; set; } = string.Empty;
    }
}