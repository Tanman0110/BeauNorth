using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace StoreAPI.Models
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

        [Range(typeof(decimal), "0.00", "999999.99")]
        public decimal Subtotal { get; set; }

        [Range(typeof(decimal), "0.00", "999999.99")]
        public decimal TaxAmount { get; set; }

        [Range(typeof(decimal), "0.00", "999999.99")]
        public decimal ShippingAmount { get; set; }

        [Range(typeof(decimal), "0.00", "999999.99")]
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