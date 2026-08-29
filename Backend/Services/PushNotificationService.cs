using CollaGegantera.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using WebPush;
using PushSub = CollaGegantera.Shared.Models.PushSubscription;

namespace CollaGegantera.Api.Services
{
    public class PushNotificationService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<PushNotificationService> _logger;
        private readonly string _publicKey;

        private readonly Dictionary<string, object> _options;

        public PushNotificationService(
            ApplicationDbContext context,
            IConfiguration configuration,
            ILogger<PushNotificationService> logger)
        {
            _context = context;
            _logger = logger;

            _publicKey = configuration["Vapid:PublicKey"]!;
            var privateKey = configuration["Vapid:PrivateKey"]!;
            var subject = configuration["Vapid:Subject"]!;

            _options = new Dictionary<string, object>
            {
                ["vapidDetails"] = new VapidDetails(subject, _publicKey, privateKey)
            };
        }

        public string GetPublicKey() => _publicKey;

        public async Task SubscribeAsync(string userId, string endpoint, string p256dh, string auth)
        {
            var existing = await _context.PushSubscriptions
                .FirstOrDefaultAsync(s => s.UserId == userId && s.Endpoint == endpoint);

            if (existing != null) return;

            _context.PushSubscriptions.Add(new PushSub
            {
                UserId = userId,
                Endpoint = endpoint,
                P256dh = p256dh,
                Auth = auth
            });
            await _context.SaveChangesAsync();
        }

        public async Task UnsubscribeAsync(string userId, string endpoint)
        {
            var sub = await _context.PushSubscriptions
                .FirstOrDefaultAsync(s => s.UserId == userId && s.Endpoint == endpoint);

            if (sub != null)
            {
                _context.PushSubscriptions.Remove(sub);
                await _context.SaveChangesAsync();
            }
        }

        public async Task SendToUserAsync(string userId, string title, string body, string? url = null)
        {
            var subscriptions = await _context.PushSubscriptions
                .Where(s => s.UserId == userId)
                .ToListAsync();

            var client = new WebPushClient();
            var payload = System.Text.Json.JsonSerializer.Serialize(new { title, body, url });

            foreach (var sub in subscriptions)
            {
                try
                {
                    var pushSub = new WebPush.PushSubscription(sub.Endpoint, sub.P256dh, sub.Auth);
                    await client.SendNotificationAsync(pushSub, payload, _options);
                }
                catch (WebPushException ex)
                {
                    _logger.LogWarning(ex, "Error enviant push a {Endpoint}. Eliminant subscripció.", sub.Endpoint);
                    _context.PushSubscriptions.Remove(sub);
                }
            }

            await _context.SaveChangesAsync();
        }

        public async Task SendToAllAsync(string title, string body, string? url = null)
        {
            var subscriptions = await _context.PushSubscriptions.ToListAsync();
            var client = new WebPushClient();
            var payload = System.Text.Json.JsonSerializer.Serialize(new { title, body, url });
            var toRemove = new List<PushSub>();

            foreach (var sub in subscriptions)
            {
                try
                {
                    var pushSub = new WebPush.PushSubscription(sub.Endpoint, sub.P256dh, sub.Auth);
                    await client.SendNotificationAsync(pushSub, payload, _options);
                }
                catch (WebPushException ex)
                {
                    _logger.LogWarning(ex, "Error enviant push a {Endpoint}. Eliminant subscripció.", sub.Endpoint);
                    toRemove.Add(sub);
                }
            }

            if (toRemove.Any())
            {
                _context.PushSubscriptions.RemoveRange(toRemove);
                await _context.SaveChangesAsync();
            }
        }
    }
}
