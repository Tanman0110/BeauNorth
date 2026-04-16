using BeauNorthApi.Data;
using BeauNorthAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BeauNorthAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoryController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CategoryController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetCategories()
        {
            var categories = await _context.Categories
                .OrderBy(c => c.Name)
                .ToListAsync();

            return Ok(categories);
        }

        [HttpGet("active")]
        [AllowAnonymous]
        public async Task<IActionResult> GetActiveCategories()
        {
            var categories = await _context.Categories
                .Where(c => c.IsActive)
                .OrderBy(c => c.Name)
                .ToListAsync();

            return Ok(categories);
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCategory(int id)
        {
            var category = await _context.Categories
                .FirstOrDefaultAsync(c => c.CategoryId == id);

            if (category == null)
            {
                return NotFound();
            }

            return Ok(category);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> CreateCategory(Category request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var normalizedName = request.Name.Trim();

            var exists = await _context.Categories
                .AnyAsync(c => c.Name.ToLower() == normalizedName.ToLower());

            if (exists)
            {
                return BadRequest("Category name already exists.");
            }

            var category = new Category
            {
                Name = normalizedName,
                Description = request.Description?.Trim(),
                IsActive = request.IsActive,
                CreatedAt = DateTime.UtcNow
            };

            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCategory), new { id = category.CategoryId }, category);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCategory(int id, Category request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var category = await _context.Categories.FindAsync(id);
            if (category == null)
            {
                return NotFound();
            }

            var normalizedName = request.Name.Trim();

            var exists = await _context.Categories
                .AnyAsync(c => c.CategoryId != id && c.Name.ToLower() == normalizedName.ToLower());

            if (exists)
            {
                return BadRequest("Category name already exists.");
            }

            category.Name = normalizedName;
            category.Description = request.Description?.Trim();
            category.IsActive = request.IsActive;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null)
            {
                return NotFound();
            }

            category.IsActive = false;
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}