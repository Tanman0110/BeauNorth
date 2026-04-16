using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace BeauNorthAPI.Models
{
    public class Product
    {
        public int ProductId { get; set; }

        public int CategoryId { get; set; }

        [Required]
        [MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? ShortDescription { get; set; }

        public string? LongDescriptionHtml { get; set; }

        [Range(typeof(decimal), "0.01", "999999.99")]
        public decimal Price { get; set; }

        [Range(typeof(decimal), "0.00", "999999.99")]
        public decimal BaseCost { get; set; } = 0;

        [MaxLength(200)]
        public string? SizeOptions { get; set; }

        [MaxLength(500)]
        public string? ColorOptions { get; set; }

        [Range(0, int.MaxValue)]
        public int StockQuantity { get; set; }

        [Required]
        [MaxLength(100)]
        [RegularExpression(@"^[A-Z0-9\-]+$", ErrorMessage = "SKU can only contain uppercase letters, numbers, and hyphens.")]
        public string Sku { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Audience { get; set; } = "All";

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

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public Category? Category { get; set; }

        public ICollection<ProductImage> ProductImages { get; set; } = new List<ProductImage>();

        [JsonIgnore]
        public ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();

        [JsonIgnore]
        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    }
}