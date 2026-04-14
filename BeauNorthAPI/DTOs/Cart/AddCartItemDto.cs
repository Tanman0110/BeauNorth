using System.ComponentModel.DataAnnotations;

namespace BeauNorthAPI.DTOs.Cart
{
    public class AddCartItemDto
    {
        [Required]
        public int ProductId { get; set; }

        [Range(1, 100)]
        public int Quantity { get; set; }

        [MaxLength(50)]
        public string? SizeSelected { get; set; }

        [MaxLength(50)]
        public string? ColorSelected { get; set; }
    }
}