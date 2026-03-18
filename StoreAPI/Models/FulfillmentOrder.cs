using System.ComponentModel.DataAnnotations;

namespace StoreApi.Models
{
    public class FulfillmentOrder
    {
        public int FulfillmentOrderId { get; set; }

        public int OrderId { get; set; }

        [Required]
        [MaxLength(50)]
        public string Provider { get; set; } = string.Empty;

        [MaxLength(255)]
        public string? ProviderOrderId { get; set; }

        [Required]
        [MaxLength(50)]
        public string FulfillmentStatus { get; set; } = "Pending";

        [MaxLength(100)]
        public string? TrackingNumber { get; set; }

        [MaxLength(1000)]
        public string? TrackingUrl { get; set; }

        public DateTime? SubmittedAt { get; set; }
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public Order? Order { get; set; }
    }
}