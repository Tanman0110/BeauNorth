using System.ComponentModel.DataAnnotations;

namespace BeauNorthAPI.DTOs.Checkout
{
    public class CreatePayPalOrderRequestDto
    {
        public int? UserAddressId { get; set; }

        [Required]
        [MaxLength(150)]
        [RegularExpression(@"^[A-Za-z]+([ '\-][A-Za-z]+)*(\s[A-Za-z]+([ '\-][A-Za-z]+)*)*$", ErrorMessage = "Full name contains invalid characters.")]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string AddressLine1 { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? AddressLine2 { get; set; }

        [Required]
        [MaxLength(100)]
        [RegularExpression(@"^[A-Za-z]+([ '\-][A-Za-z]+)*$", ErrorMessage = "City contains invalid characters.")]
        public string City { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        [RegularExpression(@"^[A-Za-z]+([ '\-][A-Za-z]+)*$", ErrorMessage = "State contains invalid characters.")]
        public string State { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        [RegularExpression(@"^[A-Za-z0-9 \-]+$", ErrorMessage = "Postal code contains invalid characters.")]
        public string PostalCode { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        [RegularExpression(@"^[A-Za-z]+([ '\-][A-Za-z]+)*$", ErrorMessage = "Country contains invalid characters.")]
        public string Country { get; set; } = string.Empty;
    }
}