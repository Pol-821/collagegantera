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
    public class RolesController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly ApplicationDbContext _context;
        private readonly NotificationService _notificationService;

        public RolesController(UserManager<AppUser> userManager, RoleManager<IdentityRole> roleManager, ApplicationDbContext context, NotificationService notificationService)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _context = context;
            _notificationService = notificationService;
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsersWithRoles()
        {
            var users = await _userManager.Users
                .Select(u => new
                {
                    u.Id,
                    u.Nom,
                    u.Cognoms,
                    u.Email,
                    Roles = _userManager.GetRolesAsync(u).Result
                })
                .ToListAsync();

            return Ok(users);
        }

        [HttpGet("available")]
        public async Task<IActionResult> GetAvailableRoles()
        {
            var roles = await _roleManager.Roles
                .Select(r => r.Name)
                .ToListAsync();

            return Ok(roles);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("assign")]
        public async Task<IActionResult> AssignRole([FromBody] RoleAssignmentDto dto)
        {
            var user = await _userManager.FindByIdAsync(dto.UserId);
            if (user == null) return NotFound(new { Message = "Usuari no trobat." });

            if (!await _roleManager.RoleExistsAsync(dto.Role))
                return BadRequest(new { Message = "Rol inexistent." });

            var result = await _userManager.AddToRoleAsync(user, dto.Role);
            if (!result.Succeeded) return BadRequest(result.Errors);

            var roleNames = new Dictionary<string, string>
            {
                ["Admin"] = "administrador",
                ["OrganitzadorTrobades"] = "organitzador de trobades",
                ["OrganitzadorAssajos"] = "organitzador d'assajos",
                ["Fotograf"] = "fotògraf",
            };
            var rolNom = roleNames.TryGetValue(dto.Role, out var nom) ? nom : dto.Role;

            await _notificationService.SendAsync(
                dto.UserId,
                "Rol assignat",
                $"Se t'ha assignat el rol de {rolNom}.");

            return Ok(new { Message = $"Rol '{dto.Role}' assignat a {user.Nom} {user.Cognoms}." });
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("remove")]
        public async Task<IActionResult> RemoveRole([FromBody] RoleAssignmentDto dto)
        {
            var user = await _userManager.FindByIdAsync(dto.UserId);
            if (user == null) return NotFound(new { Message = "Usuari no trobat." });

            var result = await _userManager.RemoveFromRoleAsync(user, dto.Role);
            if (!result.Succeeded) return BadRequest(result.Errors);

            var roleNames = new Dictionary<string, string>
            {
                ["Admin"] = "administrador",
                ["OrganitzadorTrobades"] = "organitzador de trobades",
                ["OrganitzadorAssajos"] = "organitzador d'assajos",
                ["Fotograf"] = "fotògraf",
            };
            var rolNom = roleNames.TryGetValue(dto.Role, out var nom) ? nom : dto.Role;

            await _notificationService.SendAsync(
                dto.UserId,
                "Rol eliminat",
                $"Se t'ha eliminat el rol de {rolNom}.");

            return Ok(new { Message = $"Rol '{dto.Role}' eliminat de {user.Nom} {user.Cognoms}." });
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("users/{userId}")]
        public async Task<IActionResult> DeleteUser(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return NotFound(new { Message = "Usuari no trobat." });

            var currentUser = await _userManager.FindByIdAsync(User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier));
            if (currentUser != null && currentUser.Id == userId)
                return BadRequest(new { Message = "No et pots eliminar a tu mateix." });

            var familyMemberRoles = await _context.FamilyMemberRoles
                .Where(f => f.UserId == userId)
                .ToListAsync();
            _context.FamilyMemberRoles.RemoveRange(familyMemberRoles);

            var eventRegistrations = await _context.EventRegistrations
                .Where(r => r.UserId == userId)
                .ToListAsync();
            _context.EventRegistrations.RemoveRange(eventRegistrations);

            var attendances = await _context.Attendances
                .Where(a => a.AppUserId == userId)
                .ToListAsync();
            _context.Attendances.RemoveRange(attendances);

            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId)
                .ToListAsync();
            _context.Notifications.RemoveRange(notifications);

            await _context.SaveChangesAsync();

            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded) return BadRequest(result.Errors);

            return Ok(new { Message = "Usuari eliminat correctament." });
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("non-account-members")]
        public async Task<IActionResult> GetNonAccountMembers()
        {
            var members = await _context.FamilyMemberRoles
                .Where(f => !f.HasAccount)
                .Select(f => new
                {
                    f.Id,
                    f.UserId,
                    f.Nom,
                    f.Cognoms,
                    f.Email,
                    f.FamilyGroupId
                })
                .ToListAsync();

            return Ok(members);
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("non-account-members/{id}")]
        public async Task<IActionResult> DeleteNonAccountMember(string id)
        {
            var member = await _context.FamilyMemberRoles.FindAsync(id);
            if (member == null) return NotFound(new { Message = "Membre no trobat." });
            if (member.HasAccount) return BadRequest(new { Message = "Aquest membre té compte associat. Usa l'eliminació d'usuaris." });

            var registrations = await _context.EventRegistrations
                .Where(r => r.UserId == member.UserId)
                .ToListAsync();
            _context.EventRegistrations.RemoveRange(registrations);

            _context.FamilyMemberRoles.Remove(member);
            await _context.SaveChangesAsync();

            return Ok(new { Message = $"Membre {member.Nom} {member.Cognoms} eliminat." });
        }
    }

    public class RoleAssignmentDto
    {
        public string UserId { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }
}
