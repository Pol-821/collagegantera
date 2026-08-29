using CollaGegantera.Api.Data;
using CollaGegantera.Shared.DTOs;
using CollaGegantera.Shared.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CollaGegantera.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EventAssignmentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public EventAssignmentsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // === TASCA 4.4: ENDPOINT D'ASSIGNACIÓ ===
        // Només els organitzadors poden dir qui balla què en un esdeveniment
        [HttpPost("assign")]
        [Authorize(Roles = "OrganitzadorTrobades,OrganitzadorAssajos")]
        public async Task<IActionResult> AssignRole([FromBody] AssignRoleDto dto)
        {
            // Validem que no hi hagi duplicats accidentals
            var existent = await _context.EventUserDanceRoles
                .AnyAsync(e => e.EventId == dto.EventId 
                            && e.AppUserId == dto.AppUserId 
                            && e.DanceRoleId == dto.DanceRoleId);
            
            if (existent) return BadRequest(new { Message = "L'usuari ja té aquest rol assignat en aquest esdeveniment." });

            var assignacio = new EventUserDanceRole
            {
                EventId = dto.EventId,
                AppUserId = dto.AppUserId,
                DanceRoleId = dto.DanceRoleId
            };

            _context.EventUserDanceRoles.Add(assignacio);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Rol de ball assignat correctament a l'usuari." });
        }

        // === TASCA 4.5: MOTOR D'EXTRACCIÓ DE MATERIAL ===
        // Qualsevol usuari autenticat pot consultar quin material ha de portar
        [HttpGet("{eventId}/my-material")]
        [Authorize]
        public async Task<IActionResult> GetMyMaterial(string eventId)
        {
            // 1. Extraiem l'ID de l'usuari de forma segura des del seu JWT
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            // 2. Extraiem NOMÉS el text del material de l'esdeveniment (Estalvi de RAM)
            var eventInfo = await _context.Events
                .Where(e => e.Id == eventId)
                .Select(e => new { e.MaterialImprescindible })
                .FirstOrDefaultAsync();

            if (eventInfo == null) return NotFound(new { Message = "Esdeveniment no trobat." });

            // 3. Algorisme de baix consum: Fem un JOIN en cascada directe a SQL
            // i només instanciem el nom i la quantitat en C#.
            var roleMaterials = await _context.EventUserDanceRoles
                .Where(eu => eu.EventId == eventId && eu.AppUserId == userId)
                .SelectMany(eu => eu.DanceRole!.RequiredMaterials)
                .Select(rm => new MaterialEspecificDto 
                { 
                    Nom = rm.RequiredMaterial!.Nom, 
                    Quantitat = rm.Quantitat 
                })
                .ToListAsync();

            // 4. Fusionem els resultats
            var result = new MyEventMaterialDto
            {
                MaterialGeneralEsdeveniment = eventInfo.MaterialImprescindible,
                MaterialEspecificRol = roleMaterials
            };

            return Ok(result);
        }
    }
}