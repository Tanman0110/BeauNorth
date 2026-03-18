using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace StoreApi.Models
{
    public class Order
    {
        public int OrderId { get; set; }

        public int UserId { get; set; }

        [Required]
        [MaxLength(50)]
        public string OrderNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Pending";

        public decimal Subtotal { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal ShippingAmount { get; set; }
        public decimal TotalAmount { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        [JsonIgnore]
        public User? User { get; set; }

        public ShippingAddress? ShippingAddress { get; set; }
        public Payment? Payment { get; set; }
        public FulfillmentOrder? FulfillmentOrder { get; set; }

        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    }
}