namespace BeauNorthAPI.Options
{
    public class CheckoutOptions
    {
        public decimal TaxRate { get; set; } = 0.06m;
        public decimal FlatShippingAmount { get; set; } = 9.95m;
        public decimal FreeShippingThreshold { get; set; } = 100m;
        public bool AutoSubmitToApliiq { get; set; } = false;
    }
}