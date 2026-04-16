using System.Text.Json;
using BeauNorthApi.Data;
using BeauNorthAPI.DTOs.Apliiq;
using BeauNorthAPI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BeauNorthAPI.Controllers
{
    [ApiController]
    [Route("api/webhooks/apliiq")]
    public class ApliiqWebhookController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IApliiqService _apliiqService;

        public ApliiqWebhookController(AppDbContext context, IApliiqService apliiqService)
        {
            _context = context;
            _apliiqService = apliiqService;
        }

        [HttpPost("fulfillment")]
        public async Task<IActionResult> Fulfillment()
        {
            Request.EnableBuffering();

            string rawBody;
            using (var reader = new StreamReader(Request.Body, leaveOpen: true))
            {
                rawBody = await reader.ReadToEndAsync();
                Request.Body.Position = 0;
            }

            var providedHmac = Request.Headers["x-apliiq-hmac"].FirstOrDefault();
            var valid = _apliiqService.VerifyWebhookSignature(rawBody, providedHmac);

            if (!valid)
            {
                return Unauthorized("Invalid webhook signature.");
            }

            ApliiqFulfillmentWebhookPayload? payload;
            try
            {
                payload = JsonSerializer.Deserialize<ApliiqFulfillmentWebhookPayload>(rawBody);
            }
            catch
            {
                return BadRequest("Invalid payload.");
            }

            if (payload?.Fulfillment == null || string.IsNullOrWhiteSpace(payload.Fulfillment.OrderId))
            {
                return BadRequest("Missing fulfillment order id.");
            }

            var fulfillmentOrder = await _context.FulfillmentOrders
                .Include(f => f.Order)
                .FirstOrDefaultAsync(f => f.Provider == "Apliiq" && f.ProviderOrderId == payload.Fulfillment.OrderId);

            if (fulfillmentOrder == null)
            {
                return NotFound("Matching fulfillment order not found.");
            }

            var status = payload.Fulfillment.Status?.Trim();
            var trackingNumber = payload.Fulfillment.TrackingNumbers?.FirstOrDefault();
            var trackingUrl = payload.Fulfillment.TrackingUrls?.FirstOrDefault();

            fulfillmentOrder.FulfillmentStatus = string.IsNullOrWhiteSpace(status) ? "Updated" : status;
            fulfillmentOrder.TrackingNumber = trackingNumber;
            fulfillmentOrder.TrackingUrl = trackingUrl;
            fulfillmentOrder.UpdatedAt = DateTime.UtcNow;

            if (fulfillmentOrder.Order != null)
            {
                fulfillmentOrder.Order.Status = string.Equals(status, "success", StringComparison.OrdinalIgnoreCase)
                    ? "Shipped"
                    : "FulfillmentUpdated";

                fulfillmentOrder.Order.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Webhook processed." });
        }
    }
}