using System.ComponentModel.DataAnnotations;

namespace BeauNorthAPI.DTOs.Products
{
    public class ProductImageDto
    {
        [Required]
        [MaxLength(50)]
        public string ColorName { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        [Url]
        public string ImageUrl { get; set; } = string.Empty;

        public bool IsPrimary { get; set; }
    }
}