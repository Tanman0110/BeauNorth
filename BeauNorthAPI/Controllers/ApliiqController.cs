using BeauNorthAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BeauNorthAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class ApliiqController : ControllerBase
    {
        private readonly IApliiqService _apliiqService;

        public ApliiqController(IApliiqService apliiqService)
        {
            _apliiqService = apliiqService;
        }

        [HttpGet("config-status")]
        public async Task<IActionResult> GetConfigStatus()
        {
            var summary = await _apliiqService.GetConfigurationSummaryAsync();
            var isValid = await _apliiqService.ValidateConfigurationAsync();

            return Ok(new
            {
                IsValid = isValid,
                Summary = summary
            });
        }

        [HttpGet("order/{providerOrderId}")]
        public async Task<IActionResult> GetApliiqOrder(string providerOrderId)
        {
            var raw = await _apliiqService.GetOrderRawAsync(providerOrderId);
            return Content(raw, "application/json");
        }
    }
}