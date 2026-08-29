using CollaGegantera.Api.Data;
using CollaGegantera.Api.Services;
using CollaGegantera.Shared.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CollaGegantera.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AnnouncementsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<AppUser> _userManager;
        private readonly NotificationService _notificationService;

        public AnnouncementsController(ApplicationDbContext context, UserManager<AppUser> userManager, NotificationService notificationService)
        {
            _context = context;
            _userManager = userManager;
            _notificationService = notificationService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var announcements = await _context.Announcements
                .OrderByDescending(a => a.IsPinned)
                .ThenByDescending(a => a.CreatedAt)
                .Select(a => new
                {
                    a.Id,
                    a.Title,
                    a.Body,
                    a.AuthorId,
                    a.CreatedAt,
                    a.IsPinned,
                    a.ImageUrl
                })
                .ToListAsync();

            return Ok(announcements);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,OrganitzadorTrobades,OrganitzadorAssajos")]
        public async Task<IActionResult> Create([FromBody] CreateAnnouncementDto dto)
        {
            var authorId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var announcement = new Announcement
            {
                Title = dto.Title,
                Body = dto.Body,
                AuthorId = authorId!,
                IsPinned = dto.IsPinned,
                ImageUrl = dto.ImageUrl
            };

            _context.Announcements.Add(announcement);
            await _context.SaveChangesAsync();

            await _notificationService.SendToAllAsync(
                $"Nou anunci: {dto.Title}",
                dto.Body.Length > 200 ? dto.Body.Substring(0, 200) + "..." : dto.Body);

            return CreatedAtAction(nameof(GetAll), new { id = announcement.Id }, announcement);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,OrganitzadorTrobades,OrganitzadorAssajos")]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateAnnouncementDto dto)
        {
            var announcement = await _context.Announcements.FindAsync(id);
            if (announcement == null) return NotFound();

            if (!string.IsNullOrWhiteSpace(dto.Title))
                announcement.Title = dto.Title;
            if (!string.IsNullOrWhiteSpace(dto.Body))
                announcement.Body = dto.Body;
            if (dto.IsPinned.HasValue)
                announcement.IsPinned = dto.IsPinned.Value;
            if (dto.ImageUrl != null)
                announcement.ImageUrl = dto.ImageUrl;

            await _context.SaveChangesAsync();
            return Ok(announcement);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,OrganitzadorTrobades,OrganitzadorAssajos")]
        public async Task<IActionResult> Delete(string id)
        {
            var announcement = await _context.Announcements.FindAsync(id);
            if (announcement == null) return NotFound();

            _context.Announcements.Remove(announcement);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }

    public class CreateAnnouncementDto
    {
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public bool IsPinned { get; set; }
        public string? ImageUrl { get; set; }
    }

    public class UpdateAnnouncementDto
    {
        public string? Title { get; set; }
        public string? Body { get; set; }
        public bool? IsPinned { get; set; }
        public string? ImageUrl { get; set; }
    }
}
