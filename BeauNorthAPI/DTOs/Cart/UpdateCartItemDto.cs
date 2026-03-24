using System.ComponentModel.DataAnnotations;

namespace BeauNorthAPI.DTOs.Cart
{
    public class UpdateCartItemDto
    {
        [Range(1, 100)]
        public int Quantity { get; set; }
    }
}