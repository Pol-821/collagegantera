using CollaGegantera.Api.Data;
using CollaGegantera.Api.Services;
using CollaGegantera.Shared.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IO;

namespace CollaGegantera.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class GalleryController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly GoogleDriveService _driveService;

        public GalleryController(ApplicationDbContext context, GoogleDriveService driveService)
        {
            _context = context;
            _driveService = driveService;
        }

        [HttpPost("upload/{eventId}")]
        [Authorize(Roles = "Fotograf,Admin,OrganitzadorTrobades,OrganitzadorAssajos")]
        public async Task<IActionResult> UploadImage(string eventId, IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest(new { Message = "Cap arxiu seleccionat." });

            var ev = await _context.Events.FindAsync(eventId);
            if (ev == null) return NotFound(new { Message = "Esdeveniment no trobat." });

            var ext = Path.GetExtension(file.FileName);
            var fileName = $"{eventId}_{Guid.NewGuid()}{ext}";

            using var stream = new MemoryStream();
            await file.CopyToAsync(stream);
            stream.Position = 0;

            var url = await _driveService.UploadImageAsync(stream, fileName, file.ContentType, isAvatar: false);

            return Ok(new { Message = "Imatge pujada correctament.", Url = url });
        }

        [HttpGet("{eventId}")]
        public async Task<IActionResult> GetEventImages(string eventId)
        {
            var photos = await _context.Photos
                .Where(p => p.EventId == eventId)
                .OrderByDescending(p => p.UploadedAt)
                .Select(p => new
                {
                    p.Id,
                    p.Url,
                    p.Description,
                    p.UploadedAt,
                    p.Year
                })
                .ToListAsync();

            return Ok(new { Total = photos.Count, Imatges = photos });
        }
    }
}