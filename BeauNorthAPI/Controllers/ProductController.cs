using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BeauNorthApi.Data;
using BeauNorthAPI.DTOs.Products;
using BeauNorthAPI.Models;

namespace BeauNorthAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProductController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetProducts()
        {
            var products = await _context.Products
                .Include(p => p.Category)
                .OrderBy(p => p.Name)
                .ToListAsync();

            return Ok(products);
        }

        [HttpGet("active")]
        [AllowAnonymous]
        public async Task<IActionResult> GetActiveProducts()
        {
            var products = await _context.Products
                .Include(p => p.Category)
                .Where(p => p.IsActive)
                .OrderBy(p => p.Name)
                .ToListAsync();

            return Ok(products);
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetProduct(int id)
        {
            var product = await _context.Products
                .Include(p => p.Category)
                .FirstOrDefaultAsync(p => p.ProductId == id);

            if (product == null)
            {
                return NotFound();
            }

            return Ok(product);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> CreateProduct(CreateProductDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var categoryExists = await _context.Categories.AnyAsync(c => c.CategoryId == request.CategoryId);
            if (!categoryExists)
            {
                return BadRequest("Invalid CategoryId.");
            }

            var normalizedSku = request.Sku.Trim().ToUpper();

            var skuExists = await _context.Products.AnyAsync(p => p.Sku == normalizedSku);
            if (skuExists)
            {
                return BadRequest("SKU already exists.");
            }

            if (request.IsFulfillmentEnabled &&
                string.Equals(request.FulfillmentProvider?.Trim(), "Apliiq", StringComparison.OrdinalIgnoreCase) &&
                (string.IsNullOrWhiteSpace(request.ExternalProductId) || string.IsNullOrWhiteSpace(request.ExternalVariantId)))
            {
                return BadRequest("Apliiq-enabled products require ExternalProductId and ExternalVariantId.");
            }

            var product = new Product
            {
                CategoryId = request.CategoryId,
                Name = request.Name.Trim(),
                Description = request.Description?.Trim(),
                Price = request.Price,
                BaseCost = request.BaseCost,
                ImageUrl = request.ImageUrl?.Trim(),
                SizeOptions = request.SizeOptions?.Trim(),
                ColorOptions = request.ColorOptions?.Trim(),
                StockQuantity = request.StockQuantity,
                Sku = normalizedSku,
                Audience = request.Audience,
                FulfillmentProvider = string.IsNullOrWhiteSpace(request.FulfillmentProvider)
                    ? "Manual"
                    : request.FulfillmentProvider.Trim(),
                ExternalProductId = request.ExternalProductId?.Trim(),
                ExternalVariantId = request.ExternalVariantId?.Trim(),
                ExternalDesignId = request.ExternalDesignId?.Trim(),
                ExternalSku = request.ExternalSku?.Trim(),
                IsFulfillmentEnabled = request.IsFulfillmentEnabled,
                IsActive = request.IsActive,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProduct), new { id = product.ProductId }, product);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProduct(int id, UpdateProductDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var product = await _context.Products.FindAsync(id);
            if (product == null)
            {
                return NotFound();
            }

            var categoryExists = await _context.Categories.AnyAsync(c => c.CategoryId == request.CategoryId);
            if (!categoryExists)
            {
                return BadRequest("Invalid CategoryId.");
            }

            var normalizedSku = request.Sku.Trim().ToUpper();

            var skuExists = await _context.Products.AnyAsync(p => p.Sku == normalizedSku && p.ProductId != id);
            if (skuExists)
            {
                return BadRequest("SKU already exists.");
            }

            if (request.IsFulfillmentEnabled &&
                string.Equals(request.FulfillmentProvider?.Trim(), "Apliiq", StringComparison.OrdinalIgnoreCase) &&
                (string.IsNullOrWhiteSpace(request.ExternalProductId) || string.IsNullOrWhiteSpace(request.ExternalVariantId)))
            {
                return BadRequest("Apliiq-enabled products require ExternalProductId and ExternalVariantId.");
            }

            product.CategoryId = request.CategoryId;
            product.Name = request.Name.Trim();
            product.Description = request.Description?.Trim();
            product.Price = request.Price;
            product.BaseCost = request.BaseCost;
            product.ImageUrl = request.ImageUrl?.Trim();
            product.SizeOptions = request.SizeOptions?.Trim();
            product.ColorOptions = request.ColorOptions?.Trim();
            product.StockQuantity = request.StockQuantity;
            product.Sku = normalizedSku;
            product.Audience = request.Audience;
            product.FulfillmentProvider = string.IsNullOrWhiteSpace(request.FulfillmentProvider)
                ? "Manual"
                : request.FulfillmentProvider.Trim();
            product.ExternalProductId = request.ExternalProductId?.Trim();
            product.ExternalVariantId = request.ExternalVariantId?.Trim();
            product.ExternalDesignId = request.ExternalDesignId?.Trim();
            product.ExternalSku = request.ExternalSku?.Trim();
            product.IsFulfillmentEnabled = request.IsFulfillmentEnabled;
            product.IsActive = request.IsActive;
            product.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var product = await _context.Products.FindAsync(id);

            if (product == null)
            {
                return NotFound();
            }

            product.IsActive = false;
            product.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        private static string NormalizeAudience(string? audience)
        {
            var value = audience?.Trim();

            return value switch
            {
                "Men" => "Men",
                "Women" => "Women",
                "Children" => "Children",
                _ => "All"
            };
        }
    }
}