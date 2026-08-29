using CollaGegantera.Api.Data;
using CollaGegantera.Shared.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CollaGegantera.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PhotosController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PhotosController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? year)
        {
            var query = _context.Photos.AsQueryable();

            if (year.HasValue)
                query = query.Where(p => p.Year == year.Value);

            var photos = await query
                .OrderByDescending(p => p.UploadedAt)
                .Select(p => new
                {
                    p.Id,
                    p.EventId,
                    p.Url,
                    p.Description,
                    p.UploadedById,
                    p.UploadedAt,
                    p.Year
                })
                .ToListAsync();

            return Ok(photos);
        }

        [HttpGet("grouped")]
        public async Task<IActionResult> GetGrouped()
        {
            var photos = await _context.Photos
                .OrderByDescending(p => p.Year)
                .ThenByDescending(p => p.UploadedAt)
                .ToListAsync();

            var grouped = photos
                .GroupBy(p => p.Year)
                .Select(g => new
                {
                    Year = g.Key,
                    Events = g.GroupBy(p => p.EventId)
                        .Select(eg => new
                        {
                            EventId = eg.Key,
                            Photos = eg.Select(p => new
                            {
                                p.Id,
                                p.Url,
                                p.Description,
                                p.UploadedById,
                                p.UploadedAt
                            }).ToList()
                        }).ToList()
                }).ToList();

            return Ok(grouped);
        }

        [HttpPost]
        [Authorize(Roles = "Fotograf,Admin,OrganitzadorTrobades,OrganitzadorAssajos")]
        public async Task<IActionResult> Create([FromBody] CreatePhotoDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var photo = new Photo
            {
                EventId = dto.EventId,
                Url = dto.Url,
                Description = dto.Description,
                UploadedById = userId,
                Year = dto.Year
            };

            _context.Photos.Add(photo);
            await _context.SaveChangesAsync();

            return Ok(photo);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Fotograf,Admin")]
        public async Task<IActionResult> Delete(string id)
        {
            var photo = await _context.Photos.FindAsync(id);
            if (photo == null) return NotFound();

            _context.Photos.Remove(photo);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }

    public class CreatePhotoDto
    {
        public string EventId { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int Year { get; set; }
    }
}
