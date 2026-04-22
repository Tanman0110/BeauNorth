namespace BeauNorthAPI.Services.Payments
{
    public interface IPayPalService
    {
        Task<PayPalCreateOrderResult> CreateOrderAsync(BeauNorthAPI.Models.Order order, CancellationToken cancellationToken = default);
        Task<PayPalCaptureOrderResult> CaptureOrderAsync(string payPalOrderId, CancellationToken cancellationToken = default);
    }

    public class PayPalCreateOrderResult
    {
        public string OrderId { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string RawResponse { get; set; } = string.Empty;
    }

    public class PayPalCaptureOrderResult
    {
        public bool Success { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? CaptureId { get; set; }
        public string? PayerEmail { get; set; }
        public string? FundingSource { get; set; }
        public string RawResponse { get; set; } = string.Empty;
    }
}