using CollaGegantera.Api.Data;
using CollaGegantera.Shared.DTOs;
using CollaGegantera.Shared.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace CollaGegantera.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Exigim JWT
    public class AttendanceController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AttendanceController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost("group-enroll")]
        public async Task<IActionResult> GroupEnroll([FromBody] GroupAttendanceDto dto)
        {
            var familyGroupId = User.FindFirst("FamilyGroupId")?.Value;
            if (string.IsNullOrEmpty(familyGroupId)) 
            {
                return Unauthorized(new { Message = "No pertanys a cap nucli familiar vàlid." });
            }

            var eventExists = await _context.Events.FindAsync(dto.EventId);
            if (eventExists == null) return NotFound(new { Message = "Esdeveniment no trobat." });

            if (eventExists.DataHora < DateTime.Now)
                return BadRequest(new { Message = "L'esdeveniment ja ha començat. No és possible inscriure-s'hi." });

            var validFamilyMembers = await _context.Users
                .Where(u => u.FamilyGroupId == familyGroupId && dto.UserIds.Contains(u.Id))
                .Select(u => u.Id)
                .ToListAsync();

            if (validFamilyMembers.Count != dto.UserIds.Count)
            {
                return BadRequest(new { Message = "S'ha detectat un intent d'inscriure usuaris fora de la teva unitat familiar." });
            }

            var alreadyAttending = await _context.Attendances
                .Where(a => a.EventId == dto.EventId && validFamilyMembers.Contains(a.AppUserId))
                .Select(a => a.AppUserId)
                .ToListAsync();

            var usersToEnroll = validFamilyMembers.Except(alreadyAttending).ToList();

            if (!usersToEnroll.Any())
            {
                return Ok(new { Message = "Tots els usuaris seleccionats ja estaven inscrits prèviament." });
            }

            var newAttendances = usersToEnroll.Select(userId => new Attendance
            {
                EventId = dto.EventId,
                AppUserId = userId,
                DataConfirmacio = DateTime.Now
            }).ToList();

            _context.Attendances.AddRange(newAttendances);
            await _context.SaveChangesAsync();

            return Ok(new { Message = $"S'han inscrit {newAttendances.Count} membres correctament a l'esdeveniment." });
        }

        [HttpGet("{eventId}/attendees")]
        public async Task<IActionResult> GetAttendees(string eventId)
        {
            // 1. Comprovem l'existència de l'esdeveniment (Sense carregar-lo a memòria, només verificant)
            var eventExists = await _context.Events.AnyAsync(e => e.Id == eventId);
            if (!eventExists) return NotFound(new { Message = "Esdeveniment no trobat." });

            bool isOrganizer = User.IsInRole("OrganitzadorTrobades") || User.IsInRole("OrganitzadorAssajos");

            if (isOrganizer)
            {
                var attendeesList = await _context.Attendances
                    .Where(a => a.EventId == eventId)
                    .Select(a => new { NomComplet = a.AppUser!.Nom + " " + a.AppUser.Cognoms })
                    .ToListAsync();

                return Ok(new { 
                    Total = attendeesList.Count, 
                    Llista = attendeesList 
                });
            }
            else
            {
                var totalAttendees = await _context.Attendances
                    .CountAsync(a => a.EventId == eventId);

                return Ok(new { 
                    Total = totalAttendees, 
                    Message = "Per privacitat, només pots veure el volum total d'assistents." 
                });
            }
        }

        [HttpGet("leaderboard")]
        public async Task<IActionResult> GetLeaderboard()
        {
            var participacionsPerUsuari = await _context.EventRegistrations
                .GroupBy(r => r.UserId)
                .Select(g => new { UserId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.UserId, x => x.Count);

            var totsUsuaris = await _context.Users
                .Select(u => new { u.Id, u.Nom, u.Cognoms })
                .ToListAsync();

            var totsFamiliars = await _context.FamilyMemberRoles
                .Where(f => !f.HasAccount && f.Nom != null && f.Cognoms != null)
                .Select(f => new { f.UserId, f.Nom, f.Cognoms })
                .ToListAsync();

            var classificacio = totsUsuaris
                .Select(u => new LeaderboardDto
                {
                    Nom = u.Nom,
                    Cognoms = u.Cognoms,
                    TotalAssistencies = participacionsPerUsuari.ContainsKey(u.Id) ? participacionsPerUsuari[u.Id] : 0
                })
                .Concat(totsFamiliars.Select(f => new LeaderboardDto
                {
                    Nom = f.Nom!,
                    Cognoms = f.Cognoms!,
                    TotalAssistencies = participacionsPerUsuari.ContainsKey(f.UserId) ? participacionsPerUsuari[f.UserId] : 0
                }))
                .OrderByDescending(x => x.TotalAssistencies)
                .Take(10)
                .ToList();

            return Ok(new { Leaderboard = classificacio, TotalMembers = totsUsuaris.Count + totsFamiliars.Count });
        }
    }
}