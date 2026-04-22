using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace BeauNorthAPI.Models
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

        [MaxLength(255)]
        public string? ProviderOrderId { get; set; }

        [MaxLength(50)]
        public string? PaymentMethodType { get; set; }

        [MaxLength(255)]
        [EmailAddress]
        public string? PayerEmail { get; set; }

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Pending";

        [Range(typeof(decimal), "0.00", "999999.99")]
        public decimal Amount { get; set; }

        public DateTime? PaidAt { get; set; }

        [JsonIgnore]
        public Order? Order { get; set; }
    }
}