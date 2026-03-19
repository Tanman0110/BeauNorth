using System.ComponentModel.DataAnnotations;

namespace StoreAPI.DTOs.Products
{
    public class UpdateProductDto
    {
        [Required]
        public int CategoryId { get; set; }

        [Required]
        [MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Description { get; set; }

        [Range(typeof(decimal), "0.01", "999999.99")]
        public decimal Price { get; set; }

        [Url]
        [MaxLength(500)]
        public string? ImageUrl { get; set; }

        [MaxLength(200)]
        public string? SizeOptions { get; set; }

        [MaxLength(200)]
        public string? ColorOptions { get; set; }

        [Range(0, int.MaxValue)]
        public int StockQuantity { get; set; }

        [Required]
        [MaxLength(100)]
        [RegularExpression(@"^[A-Z0-9\-]+$")]
        public string Sku { get; set; } = string.Empty;

        public bool IsActive { get; set; }
    }
}