using System.ComponentModel.DataAnnotations;

namespace StoreApi.Models
{
    public class OrderItem
    {
        public int OrderItemId { get; set; }

        public int OrderId { get; set; }
        public int ProductId { get; set; }

        public int Quantity { get; set; }
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

        public Order? Order { get; set; }
        public Product? Product { get; set; }
    }
}