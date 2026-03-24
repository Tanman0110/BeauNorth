using System.ComponentModel.DataAnnotations;

namespace StoreAPI.DTOs.Users
{
    public class UpdateAccountDto
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
    }
}