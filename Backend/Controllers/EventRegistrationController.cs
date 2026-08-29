using CollaGegantera.Api.Data;
using CollaGegantera.Api.Services;
using CollaGegantera.Shared.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CollaGegantera.Api.Controllers
{
    [Route("api/events/{eventId}/registration")]
    [ApiController]
    [Authorize]
    public class EventRegistrationController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly NotificationService _notificationService;

        public EventRegistrationController(ApplicationDbContext context, NotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        [HttpGet]
        public async Task<IActionResult> GetRegistration(string eventId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var registration = await _context.EventRegistrations
                .FirstOrDefaultAsync(r => r.EventId == eventId && r.UserId == userId);

            return Ok(new { Registered = registration != null, RegistrationId = registration?.Id });
        }

        [HttpPost]
        public async Task<IActionResult> Register(string eventId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var ev = await _context.Events.FindAsync(eventId);
            if (ev == null) return NotFound("Esdeveniment no trobat.");

            if (ev.DataHora < DateTime.Now)
                return BadRequest(new { Message = "L'esdeveniment ja ha començat. No és possible inscriure-s'hi." });

            var existing = await _context.EventRegistrations
                .FirstOrDefaultAsync(r => r.EventId == eventId && r.UserId == userId);
            if (existing != null) return Ok(new { Message = "Ja estàs inscrit." });

            var registration = new EventRegistration
            {
                EventId = eventId,
                UserId = userId
            };
            _context.EventRegistrations.Add(registration);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Inscrit correctament.", RegistrationId = registration.Id });
        }

        [HttpPost("bulk")]
        public async Task<IActionResult> BulkRegister(string eventId, [FromBody] BulkRegistrationDto dto)
        {
            var ev = await _context.Events.FindAsync(eventId);
            if (ev == null) return NotFound("Esdeveniment no trobat.");

            if (ev.DataHora < DateTime.Now)
                return BadRequest(new { Message = "L'esdeveniment ja ha començat. No és possible inscriure-s'hi." });

            var results = new List<object>();
            foreach (var userId in dto.UserIds)
            {
                var user = await _context.Users.FindAsync(userId);
                string displayName;

                if (user != null)
                {
                    displayName = $"{user.Nom} {user.Cognoms}";
                }
                else
                {
                    var fmr = await _context.FamilyMemberRoles
                        .FirstOrDefaultAsync(f => f.UserId == userId);
                    if (fmr == null)
                    {
                        results.Add(new { UserId = userId, Success = false, Message = "Membre no trobat." });
                        continue;
                    }
                    displayName = $"{fmr.Nom} {fmr.Cognoms}";
                }

                var existing = await _context.EventRegistrations
                    .FirstOrDefaultAsync(r => r.EventId == eventId && r.UserId == userId);
                if (existing != null)
                {
                    results.Add(new { UserId = userId, Success = false, Message = $"{displayName} ja està inscrit." });
                    continue;
                }

                _context.EventRegistrations.Add(new EventRegistration
                {
                    EventId = eventId,
                    UserId = userId
                });
                results.Add(new { UserId = userId, Success = true, Message = $"{displayName} inscrit." });
            }

            await _context.SaveChangesAsync();
            return Ok(results);
        }

        [HttpDelete]
        public async Task<IActionResult> Unregister(string eventId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var registration = await _context.EventRegistrations
                .FirstOrDefaultAsync(r => r.EventId == eventId && r.UserId == userId);
            if (registration == null) return NotFound("No estàs inscrit.");

            _context.EventRegistrations.Remove(registration);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Inscripció cancel·lada." });
        }

        [HttpDelete("{userId}")]
        public async Task<IActionResult> UnregisterUser(string eventId, string userId)
        {
            var currentUser = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isAdmin = User.IsInRole("Admin") || User.IsInRole("OrganitzadorTrobades") || User.IsInRole("OrganitzadorAssajos");

            if (!isAdmin && currentUser != userId)
                return Forbid();

            var registration = await _context.EventRegistrations
                .FirstOrDefaultAsync(r => r.EventId == eventId && r.UserId == userId);
            if (registration == null) return NotFound("No inscrit.");

            _context.EventRegistrations.Remove(registration);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Inscripció cancel·lada." });
        }

        [Authorize(Roles = "Admin,OrganitzadorTrobades,OrganitzadorAssajos")]
        [HttpPut("roles")]
        public async Task<IActionResult> UpdateRoles(string eventId, [FromBody] List<UpdateRoleDto> updates)
        {
            var ev = await _context.Events.FindAsync(eventId);
            var evNom = ev?.Nom ?? "esdeveniment";

            var userIds = updates.Select(u => u.UserId).Distinct().ToList();
            var existingUserIds = await _context.Users
                .Where(u => userIds.Contains(u.Id))
                .Select(u => u.Id)
                .ToListAsync();
            var existingSet = new HashSet<string>(existingUserIds);

            foreach (var update in updates)
            {
                var reg = await _context.EventRegistrations
                    .FirstOrDefaultAsync(r => r.EventId == eventId && r.UserId == update.UserId);
                if (reg == null) continue;

                var oldRole = reg.AssignedRole;
                reg.AssignedRole = update.Role;

                if (!existingSet.Contains(update.UserId)) continue;

                if (!string.IsNullOrEmpty(update.Role) && update.Role != oldRole)
                {
                    await _notificationService.SendAsync(
                        update.UserId,
                        "Rol assignat",
                        $"Se t'ha assignat el rol \"{update.Role}\" per a l'esdeveniment \"{evNom}\".",
                        eventId);
                }
                else if (string.IsNullOrEmpty(update.Role) && !string.IsNullOrEmpty(oldRole))
                {
                    await _notificationService.SendAsync(
                        update.UserId,
                        "Rol eliminat",
                        $"Se t'ha eliminat el rol \"{oldRole}\" de l'esdeveniment \"{evNom}\".",
                        eventId);
                }
            }
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Rols actualitzats." });
        }
    }

    public class UpdateRoleDto
    {
        public string UserId { get; set; } = string.Empty;
        public string? Role { get; set; }
    }

    public class BulkRegistrationDto
    {
        public List<string> UserIds { get; set; } = new();
    }
}
