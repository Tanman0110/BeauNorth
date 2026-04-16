using BeauNorthAPI.DTOs.Apliiq;
using BeauNorthAPI.Models;

namespace BeauNorthAPI.Services
{
    public interface IApliiqService
    {
        Task<object> GetConfigurationSummaryAsync();
        Task<bool> ValidateConfigurationAsync();
        Task<ApliiqCreateOrderResult> SubmitOrderAsync(Order order);
        Task<string> GetOrderRawAsync(string apliiqOrderId);
        bool VerifyWebhookSignature(string rawRequestBody, string? providedHmacHeader);
    }
}