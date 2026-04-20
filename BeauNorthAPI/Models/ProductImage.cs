using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace BeauNorthAPI.Models
{
    public class ProductImage
    {
        public int ProductImageId { get; set; }

        public int ProductId { get; set; }

        [Required]
        [MaxLength(50)]
        public string ColorName { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        [Url]
        public string ImageUrl { get; set; } = string.Empty;

        public bool IsPrimary { get; set; } = false;

        [JsonIgnore]
        public Product? Product { get; set; }
    }
}