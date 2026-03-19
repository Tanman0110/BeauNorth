using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace StoreAPI.Models
{
    public class OrderItem
    {
        public int OrderItemId { get; set; }

        public int OrderId { get; set; }
        public int ProductId { get; set; }

        [Range(1, 100)]
        public int Quantity { get; set; }

        [Range(typeof(decimal), "0.01", "999.99")]
        public decimal UnitPrice { get; set; }

        [Required]
        [MaxLength(150)]
        public string ProductNameSnapshot { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string ProductSkuSnapshot { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? SizeSelected { get; set; }

        [MaxLength(50)]
        public string? ColorSelected { get; set; }

        [JsonIgnore]
        public Order? Order { get; set; }

        public Product? Product { get; set; }
    }
}