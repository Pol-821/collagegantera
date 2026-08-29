using CollaGegantera.Api.Data;
using CollaGegantera.Shared.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CollaGegantera.Api.Services
{
    public class NotificationService
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<AppUser> _userManager;
        private readonly PushNotificationService _pushService;

        public NotificationService(
            ApplicationDbContext context,
            UserManager<AppUser> userManager,
            PushNotificationService pushService)
        {
            _context = context;
            _userManager = userManager;
            _pushService = pushService;
        }

        public async Task SendAsync(string userId, string title, string body, string? relatedEventId = null)
        {
            _context.Notifications.Add(new Notification
            {
                UserId = userId,
                Title = title,
                Body = body,
                Type = "General",
                RelatedEventId = relatedEventId
            });
            await _context.SaveChangesAsync();

            var user = await _userManager.FindByIdAsync(userId);
            if (user != null && user.NotificationsEnabled)
            {
                await _pushService.SendToUserAsync(userId, title, body);
            }
        }

        public async Task SendToAllExceptAsync(string? excludeUserId, string title, string body, string? relatedEventId = null)
        {
            var users = await _userManager.Users
                .Where(u => u.Id != excludeUserId)
                .ToListAsync();

            var userIds = users.Select(u => u.Id).ToList();

            _context.Notifications.AddRange(userIds.Select(uid => new Notification
            {
                UserId = uid,
                Title = title,
                Body = body,
                Type = "General",
                RelatedEventId = relatedEventId
            }));
            await _context.SaveChangesAsync();

            foreach (var user in users.Where(u => u.NotificationsEnabled))
            {
                await _pushService.SendToUserAsync(user.Id, title, body);
            }
        }

        public async Task SendToAllAsync(string title, string body, string? relatedEventId = null)
        {
            var users = await _userManager.Users.ToListAsync();

            _context.Notifications.AddRange(users.Select(u => new Notification
            {
                UserId = u.Id,
                Title = title,
                Type = "General",
                RelatedEventId = relatedEventId
            }));
            await _context.SaveChangesAsync();

            foreach (var user in users.Where(u => u.NotificationsEnabled))
            {
                await _pushService.SendToUserAsync(user.Id, title, body);
            }
        }
    }
}
