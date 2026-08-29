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
    public class SurveysController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<AppUser> _userManager;
        private readonly NotificationService _notificationService;

        public SurveysController(ApplicationDbContext context, UserManager<AppUser> userManager, NotificationService notificationService)
        {
            _context = context;
            _userManager = userManager;
            _notificationService = notificationService;
        }

        [HttpGet]
        public async Task<IActionResult> GetActiveSurveys()
        {
            var surveys = await _context.Surveys
                .Where(s => s.IsActive && (s.ExpiresAt == null || s.ExpiresAt > DateTime.Now))
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();

            var result = surveys.Select(s =>
            {
                var opts = s.GetOptions();
                var votes = s.GetVotes();
                var counts = new Dictionary<string, int>();
                foreach (var kv in votes)
                {
                    if (int.TryParse(kv.Key, out var i) && i >= 0 && i < opts.Count)
                        counts[opts[i]] = kv.Value.Count;
                }
                return new
                {
                    Id = s.Id,
                    Titol = s.Title,
                    Descripcio = s.Description,
                    Options = opts,
                    Votes = counts,
                    Tancada = !s.IsActive,
                    DataCreacio = s.CreatedAt,
                    DataTancament = s.ExpiresAt,
                };
            }).ToList();

            return Ok(result);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,OrganitzadorTrobades,OrganitzadorAssajos")]
        public async Task<IActionResult> CreateSurvey([FromBody] SurveyCreateDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var survey = new Survey
            {
                Title = dto.Title,
                Description = dto.Description,
                CreatedByUserId = userId!,
                ExpiresAt = dto.ExpiresAt
            };
            survey.SetOptions(dto.Options);

            _context.Surveys.Add(survey);
            await _context.SaveChangesAsync();

            await _notificationService.SendToAllExceptAsync(
                userId,
                "Nova enquesta",
                $"S'ha creat l'enquesta \"{dto.Title}\". Vota ara!");

            var result = new
            {
                Id = survey.Id,
                Titol = survey.Title,
                Descripcio = survey.Description,
                Options = survey.GetOptions(),
                Votes = new Dictionary<string, int>(),
                Tancada = false,
                DataCreacio = survey.CreatedAt,
                DataTancament = survey.ExpiresAt,
            };

            return Ok(result);
        }

        [HttpPost("{id}/vote")]
        public async Task<IActionResult> Vote(string id, [FromBody] VoteDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var survey = await _context.Surveys.FindAsync(id);

            if (survey == null) return NotFound();
            if (!survey.IsActive) return BadRequest(new { Message = "L'enquesta ja no és activa." });

            var votes = survey.GetVotes();
            var opts = survey.GetOptions();

            int optionIndex = dto.OptionIndex;
            if (optionIndex < 0 && !string.IsNullOrEmpty(dto.Option))
            {
                optionIndex = opts.IndexOf(dto.Option);
                if (optionIndex < 0)
                    return BadRequest(new { Message = "Opció no vàlida." });
            }

            var optionKey = optionIndex.ToString();

            if (!votes.ContainsKey(optionKey))
                votes[optionKey] = new List<string>();

            foreach (var key in votes.Keys.ToList())
            {
                votes[key].Remove(userId!);
            }

            votes[optionKey].Add(userId!);
            survey.SetVotes(votes);

            await _context.SaveChangesAsync();

            return Ok(new { Message = "Vot registrat correctament." });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,OrganitzadorTrobades,OrganitzadorAssajos")]
        public async Task<IActionResult> CloseSurvey(string id)
        {
            var survey = await _context.Surveys.FindAsync(id);
            if (survey == null) return NotFound();

            survey.IsActive = false;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}/permanent")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteSurvey(string id)
        {
            var survey = await _context.Surveys.FindAsync(id);
            if (survey == null) return NotFound();

            _context.Surveys.Remove(survey);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }

    public class SurveyCreateDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public List<string> Options { get; set; } = new List<string>();
        public DateTime? ExpiresAt { get; set; }
    }

    public class VoteDto
    {
        public int OptionIndex { get; set; } = -1;
        public string? Option { get; set; }
    }
}
