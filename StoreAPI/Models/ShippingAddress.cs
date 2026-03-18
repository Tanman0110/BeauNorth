using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace StoreApi.Models
{
    public class ShippingAddress
    {
        public int ShippingAddressId { get; set; }

        public int OrderId { get; set; }

        [Required]
        [MaxLength(150)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string AddressLine1 { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? AddressLine2 { get; set; }

        [Required]
        [MaxLength(100)]
        public string City { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string State { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string PostalCode { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Country { get; set; } = string.Empty;
        [JsonIgnore]
        public Order? Order { get; set; }
    }
}