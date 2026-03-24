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

        [MaxLength(2000)]
        public string? Description { get; set; }

        [Range(typeof(decimal), "0.01", "999.99")]
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
        [RegularExpression(@"^[A-Z0-9\-]+$", ErrorMessage = "SKU can only contain uppercase letters, numbers, and hyphens.")]
        public string Sku { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public Category? Category { get; set; }

        [JsonIgnore]
        public ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();

        [JsonIgnore]
        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    }
}