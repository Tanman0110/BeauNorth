using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace StoreApi.Models
{
    public class CartItem
    {
        public int CartItemId { get; set; }

        public int CartId { get; set; }
        public int ProductId { get; set; }
        
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        [MaxLength(50)]
        public string? SizeSelected { get; set; }

        [MaxLength(50)]
        public string? ColorSelected { get; set; }

        [JsonIgnore]
        public Cart? Cart { get; set; }
        public Product? Product { get; set; }
    }
}