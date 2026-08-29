using CollaGegantera.Api.Data;
using CollaGegantera.Shared.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CollaGegantera.Api.Controllers
{
    [Route("api/events/{eventId}/stage")]
    [ApiController]
    [Authorize]
    public class StagePositionsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public StagePositionsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetPositions(string eventId, [FromQuery] string? dance = null)
        {
            var query = _context.EventStagePositions.Where(p => p.EventId == eventId);
            if (!string.IsNullOrEmpty(dance))
                query = query.Where(p => p.DanceName == dance);

            var positions = await query.ToListAsync();

            var result = new List<object>();
            foreach (var pos in positions)
            {
                var user = await _context.Users.FindAsync(pos.UserId);
                result.Add(new
                {
                    pos.Id,
                    pos.UserId,
                    UserName = user != null ? $"{user.Nom} {user.Cognoms}" : "Desconegut",
                    pos.DanceName,
                    pos.X,
                    pos.Y,
                    pos.Notes
                });
            }

            return Ok(result);
        }

        [HttpGet("dances")]
        public async Task<IActionResult> GetDances(string eventId)
        {
            var dances = await _context.EventStagePositions
                .Where(p => p.EventId == eventId)
                .Select(p => p.DanceName)
                .Distinct()
                .ToListAsync();

            return Ok(dances);
        }

        [Authorize(Roles = "Admin,OrganitzadorTrobades,OrganitzadorAssajos")]
        [HttpPost]
        public async Task<IActionResult> SavePositions(string eventId, [FromBody] List<StagePositionDto> positions)
        {
            var danceNames = positions.Select(p => p.DanceName).Distinct().ToList();

            var existing = await _context.EventStagePositions
                .Where(p => p.EventId == eventId && danceNames.Contains(p.DanceName))
                .ToListAsync();
            _context.EventStagePositions.RemoveRange(existing);

            foreach (var pos in positions)
            {
                _context.EventStagePositions.Add(new EventStagePosition
                {
                    EventId = eventId,
                    UserId = pos.UserId,
                    DanceName = pos.DanceName,
                    X = pos.X,
                    Y = pos.Y,
                    Notes = pos.Notes
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Posicions desades." });
        }

        [Authorize(Roles = "Admin,OrganitzadorTrobades,OrganitzadorAssajos")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePosition(string eventId, string id)
        {
            var pos = await _context.EventStagePositions
                .FirstOrDefaultAsync(p => p.Id == id && p.EventId == eventId);
            if (pos == null) return NotFound();

            _context.EventStagePositions.Remove(pos);
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Posició eliminada." });
        }
    }

    public class StagePositionDto
    {
        public string UserId { get; set; } = string.Empty;
        public string DanceName { get; set; } = string.Empty;
        public double X { get; set; }
        public double Y { get; set; }
        public string? Notes { get; set; }
    }
}
