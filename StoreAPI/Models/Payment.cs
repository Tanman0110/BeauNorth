using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace StoreApi.Models
{
    public class Payment
    {
        public int PaymentId { get; set; }

        public int OrderId { get; set; }

        [Required]
        [MaxLength(50)]
        public string Provider { get; set; } = string.Empty;

        [MaxLength(255)]
        public string? ProviderPaymentId { get; set; }

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Pending";

        public decimal Amount { get; set; }

        public DateTime? PaidAt { get; set; }
        [JsonIgnore]
        public Order? Order { get; set; }
    }
}