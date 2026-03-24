using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BeauNorthApi.Data;
using BeauNorthAPI.Models;

namespace BeauNorthApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PaymentController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetPayments()
        {
            var payments = await _context.Payments
                .Include(p => p.Order)
                .OrderByDescending(p => p.PaidAt)
                .ToListAsync();

            return Ok(payments);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPayment(int id)
        {
            var payment = await _context.Payments
                .Include(p => p.Order)
                .FirstOrDefaultAsync(p => p.PaymentId == id);

            if (payment == null)
            {
                return NotFound();
            }

            return Ok(payment);
        }

        [HttpPost]
        public async Task<IActionResult> CreatePayment(Payment payment)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var orderExists = await _context.Orders
                .AnyAsync(o => o.OrderId == payment.OrderId);

            if (!orderExists)
            {
                return BadRequest("Invalid OrderId.");
            }

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPayment), new { id = payment.PaymentId }, payment);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePayment(int id, Payment updatedPayment)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != updatedPayment.PaymentId)
            {
                return BadRequest("Payment ID mismatch.");
            }

            var existingPayment = await _context.Payments.FindAsync(id);

            if (existingPayment == null)
            {
                return NotFound();
            }

            var orderExists = await _context.Orders
                .AnyAsync(o => o.OrderId == updatedPayment.OrderId);

            if (!orderExists)
            {
                return BadRequest("Invalid OrderId.");
            }

            existingPayment.OrderId = updatedPayment.OrderId;
            existingPayment.Provider = updatedPayment.Provider;
            existingPayment.ProviderPaymentId = updatedPayment.ProviderPaymentId;
            existingPayment.Status = updatedPayment.Status;
            existingPayment.Amount = updatedPayment.Amount;
            existingPayment.PaidAt = updatedPayment.PaidAt;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePayment(int id)
        {
            var payment = await _context.Payments.FindAsync(id);

            if (payment == null)
            {
                return NotFound();
            }

            _context.Payments.Remove(payment);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}