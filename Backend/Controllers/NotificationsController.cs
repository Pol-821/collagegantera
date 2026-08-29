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
    public class NotificationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public NotificationsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetMyNotifications()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Take(50)
                .Select(n => new
                {
                    n.Id,
                    n.Title,
                    n.Body,
                    n.Type,
                    n.IsRead,
                    n.CreatedAt,
                    n.RelatedEventId
                })
                .ToListAsync();

            return Ok(notifications);
        }

        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var count = await _context.Notifications
                .CountAsync(n => n.UserId == userId && !n.IsRead);

            return Ok(new { Count = count });
        }

        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(string id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

            if (notification == null) return NotFound();

            notification.IsRead = true;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(string id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

            if (notification == null) return NotFound();

            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("send")]
        [Authorize(Roles = "Admin,OrganitzadorTrobades,OrganitzadorAssajos")]
        public async Task<IActionResult> SendNotification([FromBody] SendNotificationDto dto)
        {
            var targetUser = await _context.Users.FindAsync(dto.UserId);
            if (targetUser == null) return NotFound(new { Message = "Usuari no trobat." });

            var notification = new Notification
            {
                UserId = dto.UserId,
                Title = dto.Title,
                Body = dto.Body,
                Type = "General",
                RelatedEventId = dto.RelatedEventId
            };
            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            return Ok(new { Message = $"Notificació enviada a {targetUser.Nom} {targetUser.Cognoms}." });
        }

        [HttpPost("broadcast")]
        [Authorize(Roles = "OrganitzadorTrobades,OrganitzadorAssajos")]
        public async Task<IActionResult> BroadcastNotification([FromBody] BroadcastNotificationDto dto)
        {
            var senderId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var allUsers = await _context.Users
                .Where(u => u.Id != senderId)
                .Select(u => u.Id)
                .ToListAsync();

            var notifications = allUsers.Select(userId => new Notification
            {
                UserId = userId,
                Title = dto.Title,
                Body = dto.Body,
                Type = "General"
            }).ToList();

            _context.Notifications.AddRange(notifications);
            await _context.SaveChangesAsync();

            return Ok(new { Message = $"Notificació enviada a {notifications.Count} usuaris." });
        }
    }

    public class BroadcastNotificationDto
    {
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
    }

    public class SendNotificationDto
    {
        public string UserId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string? RelatedEventId { get; set; }
    }
}
