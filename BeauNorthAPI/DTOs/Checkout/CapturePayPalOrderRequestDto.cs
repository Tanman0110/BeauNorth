using System.ComponentModel.DataAnnotations;

namespace BeauNorthAPI.DTOs.Checkout
{
    public class CapturePayPalOrderRequestDto
    {
        [Required]
        public int OrderId { get; set; }

        [Required]
        [MaxLength(100)]
        public string PayPalOrderId { get; set; } = string.Empty;
    }
}