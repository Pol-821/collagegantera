using CollaGegantera.Api.Data;
using CollaGegantera.Api.Services;
using CollaGegantera.Shared.DTOs;
using CollaGegantera.Shared.Models;
using CollaGegantera.Shared.Enums;
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
    public class EventsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<AppUser> _userManager;
        private readonly NotificationService _notificationService;

        public EventsController(ApplicationDbContext context, UserManager<AppUser> userManager, NotificationService notificationService)
        {
            _context = context;
            _userManager = userManager;
            _notificationService = notificationService;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetEvent(string id)
        {
            var ev = await _context.Events.FindAsync(id);
            if (ev == null) return NotFound(new { Message = "Esdeveniment no trobat." });

            var inscrits = await _context.EventRegistrations.CountAsync(r => r.EventId == id);

            return Ok(new
            {
                ev.Id,
                ev.Nom,
                ev.DataHora,
                ev.Descripcio,
                ev.Lloc,
                ev.Latitud,
                ev.Longitud,
                ev.MaterialImprescindible,
                ev.Normes,
                Tipus = ev.Tipus.ToString(),
                ev.RecurringPatternId,
                Inscrits = inscrits
            });
        }

        [HttpGet("{id}/registrations")]
        public async Task<IActionResult> GetRegistrations(string id)
        {
            var ev = await _context.Events.FindAsync(id);
            if (ev == null) return NotFound();

            var registrations = await _context.EventRegistrations
                .Where(r => r.EventId == id)
                .ToListAsync();

            var allUserIds = registrations.Select(r => r.UserId).Distinct().ToList();

            var accountUsers = await _context.Users
                .Where(u => allUserIds.Contains(u.Id))
                .ToDictionaryAsync(u => u.Id);

            var nonAccountMembers = await _context.FamilyMemberRoles
                .Where(fmr => allUserIds.Contains(fmr.UserId))
                .ToDictionaryAsync(fmr => fmr.UserId);

            var result = registrations.Select(r =>
            {
                if (accountUsers.TryGetValue(r.UserId, out var u))
                    return new
                    {
                        r.Id,
                        r.RegisteredAt,
                        r.AssignedRole,
                        UserId = u.Id,
                        u.Nom,
                        u.Cognoms,
                        u.Email,
                        u.AvatarUrl
                    };

                if (nonAccountMembers.TryGetValue(r.UserId, out var fmr))
                    return new
                    {
                        r.Id,
                        r.RegisteredAt,
                        r.AssignedRole,
                        UserId = fmr.UserId,
                        Nom = fmr.Nom ?? "(Sense nom)",
                        Cognoms = fmr.Cognoms ?? "",
                        Email = fmr.Email ?? "",
                        AvatarUrl = (string?)null
                    };

                return new
                {
                    r.Id,
                    r.RegisteredAt,
                    r.AssignedRole,
                    UserId = r.UserId,
                    Nom = "(Desconegut)",
                    Cognoms = "",
                    Email = "",
                    AvatarUrl = (string?)null
                };
            }).ToList();

            return Ok(result);
        }

        [HttpGet]
        public async Task<IActionResult> GetEvents([FromQuery] DateTime? start, [FromQuery] DateTime? end)
        {
            var query = _context.Events.AsQueryable();
            if (start.HasValue) query = query.Where(e => e.DataHora >= start.Value);
            if (end.HasValue) query = query.Where(e => e.DataHora <= end.Value);
            var events = await query
                .Select(e => new
                {
                    e.Id,
                    e.Nom,
                    e.DataHora,
                    e.Descripcio,
                    e.Lloc,
                    e.Latitud,
                    e.Longitud,
                    e.MaterialImprescindible,
                    e.Normes,
                    Tipus = e.Tipus.ToString(),
                    e.RecurringPatternId,
                    Inscrits = _context.EventRegistrations.Count(r => r.EventId == e.Id)
                })
                .OrderBy(e => e.DataHora)
                .ToListAsync();
            return Ok(events);
        }

        [HttpGet("upcoming")]
        public async Task<IActionResult> GetUpcomingEvents()
        {
            // Utilitzem Entity Framework per filtrar directament a la base de dades (estalvi de RAM)
            // Només obtenim els esdeveniments on la data sigui igual o superior a l'actual
            var upcomingEvents = await _context.Events
                .Where(e => e.DataHora >= DateTime.Now)
                .OrderBy(e => e.DataHora) // Ordenem del més proper al més llunyà
                .ToListAsync(); // Ara sí, un cop filtrat per SQLite, ho passem a memòria

            // Retornem la llista al Frontend (La propietat GoogleMapsUrl es calcularà automàticament aquí per a cada esdeveniment)
            return Ok(upcomingEvents);
        }

        [Authorize(Roles = "Admin,OrganitzadorTrobades,OrganitzadorAssajos")]
        [HttpPost]
        public async Task<IActionResult> CreateEvent([FromBody] EventCreateDto dto)
        {
            var nouEvent = new Event
            {
                Nom = dto.Nom,
                DataHora = dto.DataHora,
                Descripcio = dto.Descripcio,
                Lloc = dto.Lloc,
                Latitud = dto.Latitud,
                Longitud = dto.Longitud,
                MaterialImprescindible = dto.MaterialImprescindible,
                Normes = dto.Normes,
                Tipus = dto.Tipus
            };

            _context.Events.Add(nouEvent);
            await _context.SaveChangesAsync();

            // Crear esdeveniments repetitius si s'ha especificat
            if (dto.Recurring != null && dto.Recurring.TotalOccurrences > 1)
            {
                var pattern = new RecurringPattern
                {
                    DayOfWeek = dto.Recurring.DayOfWeek,
                    IntervalWeeks = dto.Recurring.IntervalWeeks,
                    TotalOccurrences = dto.Recurring.TotalOccurrences,
                    StartDate = dto.DataHora,
                    EndDate = dto.Recurring.EndDate
                };

                _context.RecurringPatterns.Add(pattern);

                for (int i = 1; i < dto.Recurring.TotalOccurrences; i++)
                {
                    var nextDate = dto.DataHora.AddDays(i * dto.Recurring.IntervalWeeks * 7);
                    if (dto.Recurring.EndDate.HasValue && nextDate > dto.Recurring.EndDate.Value)
                        break;

                    var recurringEvent = new Event
                    {
                        Nom = dto.Nom,
                        DataHora = nextDate,
                        Descripcio = dto.Descripcio,
                        Lloc = dto.Lloc,
                        Latitud = dto.Latitud,
                        Longitud = dto.Longitud,
                        MaterialImprescindible = dto.MaterialImprescindible,
                        Normes = dto.Normes,
                        Tipus = dto.Tipus,
                        RecurringPatternId = pattern.Id
                    };
                    _context.Events.Add(recurringEvent);
                }

                await _context.SaveChangesAsync();
            }

            var tipusNom = dto.Tipus == TipusEvent.Assaig ? "Assaig" : "Trobada";
            var dataStr = dto.DataHora.ToString("dddd d 'de' MMMM 'de' yyyy 'a les' HH:mm");
            await _notificationService.SendToAllAsync(
                $"Nou {tipusNom}: {dto.Nom}",
                $"S'ha creat el {tipusNom.ToLower()} \"{dto.Nom}\" el {dataStr}{(dto.Lloc != null ? $" a {dto.Lloc}" : "")}.",
                nouEvent.Id);

            return CreatedAtAction(nameof(GetEvent), new { id = nouEvent.Id }, nouEvent);
        }

        [Authorize(Roles = "Admin,OrganitzadorTrobades,OrganitzadorAssajos")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEvent(string id, [FromBody] EventCreateDto dto)
        {
            var ev = await _context.Events.FindAsync(id);
            if (ev == null) return NotFound(new { Message = "Esdeveniment no trobat." });

            ev.Nom = dto.Nom;
            ev.DataHora = dto.DataHora;
            ev.Descripcio = dto.Descripcio;
            ev.Lloc = dto.Lloc;
            ev.Latitud = dto.Latitud;
            ev.Longitud = dto.Longitud;
            ev.MaterialImprescindible = dto.MaterialImprescindible;
            ev.Normes = dto.Normes;
            ev.Tipus = dto.Tipus;

            await _context.SaveChangesAsync();
            return NoContent();
        }


        [Authorize(Roles = "Admin,OrganitzadorTrobades,OrganitzadorAssajos")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEvent(string id)
        {
            var ev = await _context.Events.FindAsync(id);
            if (ev == null) return NotFound(new { Message = "Esdeveniment no trobat." });

            var registrations = await _context.EventRegistrations.Where(r => r.EventId == id).ToListAsync();
            _context.EventRegistrations.RemoveRange(registrations);

            var stagePositions = await _context.EventStagePositions.Where(s => s.EventId == id).ToListAsync();
            _context.EventStagePositions.RemoveRange(stagePositions);

            var notifications = await _context.Notifications.Where(n => n.RelatedEventId == id).ToListAsync();
            _context.Notifications.RemoveRange(notifications);

            _context.Events.Remove(ev);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        
    }
}