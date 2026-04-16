using System.ComponentModel.DataAnnotations;
using BeauNorthAPI.Models;

namespace BeauNorthAPI.DTOs.Products
{
    public class CreateProductDto
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

        [Range(typeof(decimal), "0.00", "999999.99")]
        public decimal BaseCost { get; set; }

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

        [Required]
        public ProductAudience Audience { get; set; } = ProductAudience.All;

        [MaxLength(50)]
        public string FulfillmentProvider { get; set; } = "Manual";

        [MaxLength(100)]
        public string? ExternalProductId { get; set; }

        [MaxLength(100)]
        public string? ExternalVariantId { get; set; }

        [MaxLength(100)]
        public string? ExternalDesignId { get; set; }

        [MaxLength(100)]
        public string? ExternalSku { get; set; }

        public bool IsFulfillmentEnabled { get; set; } = false;

        public bool IsActive { get; set; } = true;
    }
}