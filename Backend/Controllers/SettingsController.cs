using CollaGegantera.Api.Data;
using CollaGegantera.Api.Services;
using CollaGegantera.Shared.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace CollaGegantera.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SettingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;
        private readonly GoogleDriveService _driveService;

        public SettingsController(ApplicationDbContext context, IWebHostEnvironment env, GoogleDriveService driveService)
        {
            _context = context;
            _env = env;
            _driveService = driveService;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetSettings()
        {
            var settings = await _context.CollaSettings.FirstOrDefaultAsync();
            if (settings == null)
            {
                settings = new CollaSettings();
                _context.CollaSettings.Add(settings);
                await _context.SaveChangesAsync();
            }
            return Ok(settings);
        }

        [HttpPut]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateSettings([FromBody] UpdateSettingsDto dto)
        {
            var settings = await _context.CollaSettings.FirstOrDefaultAsync();
            if (settings == null)
            {
                settings = new CollaSettings();
                _context.CollaSettings.Add(settings);
            }

            if (!string.IsNullOrWhiteSpace(dto.CollaName))
                settings.CollaName = dto.CollaName;
            if (!string.IsNullOrWhiteSpace(dto.PrimaryColor))
                settings.PrimaryColor = dto.PrimaryColor;
            if (dto.LogoUrl != null)
                settings.LogoUrl = dto.LogoUrl;

            await _context.SaveChangesAsync();
            return Ok(settings);
        }

        [HttpPost("logo")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UploadLogo(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { Message = "Cap fitxer proporcionat." });

            var settings = await _context.CollaSettings.FirstOrDefaultAsync();
            if (settings == null)
            {
                settings = new CollaSettings();
                _context.CollaSettings.Add(settings);
            }

            if (!string.IsNullOrEmpty(settings.LogoUrl))
                await _driveService.DeleteFileByUrlAsync(settings.LogoUrl);

            var ext = Path.GetExtension(file.FileName);
            var fileName = $"logo_{Guid.NewGuid()}{ext}";

            using var stream = new MemoryStream();
            await file.CopyToAsync(stream);
            stream.Position = 0;

            var url = await _driveService.UploadImageAsync(stream, fileName, file.ContentType, isAvatar: false);

            settings.LogoUrl = url;
            await _context.SaveChangesAsync();

            return Ok(new { LogoUrl = url });
        }

        [HttpGet("roles")]
        [AllowAnonymous]
        public async Task<IActionResult> GetRoles()
        {
            var settings = await _context.CollaSettings.FirstOrDefaultAsync();
            var rolesStr = settings?.AvailableRoles ?? "Cap de colla,Portaestendard,Geganter,Baix de gegant,Capgròs,Macero,Músic,Casteller,Geganta,Altres";
            var roles = rolesStr.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();
            return Ok(roles);
        }

        [HttpPut("roles")]
        [Authorize(Roles = "Admin,OrganitzadorTrobades,OrganitzadorAssajos")]
        public async Task<IActionResult> UpdateRoles([FromBody] List<string> roles)
        {
            var settings = await _context.CollaSettings.FirstOrDefaultAsync();
            if (settings == null)
            {
                settings = new CollaSettings();
                _context.CollaSettings.Add(settings);
            }
            settings.AvailableRoles = string.Join(",", roles);
            await _context.SaveChangesAsync();
            return Ok(roles);
        }

        [HttpGet("role-groups")]
        [AllowAnonymous]
        public async Task<IActionResult> GetRoleGroups()
        {
            var settings = await _context.CollaSettings.FirstOrDefaultAsync();
            var json = settings?.AvailableRoleGroups;
            if (string.IsNullOrWhiteSpace(json))
            {
                return Ok(new Dictionary<string, List<string>>());
            }
            var groups = JsonSerializer.Deserialize<Dictionary<string, List<string>>>(json);
            return Ok(groups ?? new Dictionary<string, List<string>>());
        }

        [HttpPut("role-groups")]
        [Authorize(Roles = "Admin,OrganitzadorTrobades,OrganitzadorAssajos")]
        public async Task<IActionResult> UpdateRoleGroups([FromBody] Dictionary<string, List<string>> groups)
        {
            var settings = await _context.CollaSettings.FirstOrDefaultAsync();
            if (settings == null)
            {
                settings = new CollaSettings();
                _context.CollaSettings.Add(settings);
            }
            settings.AvailableRoleGroups = JsonSerializer.Serialize(groups);

            var allRoles = new List<string>();
            foreach (var kvp in groups)
            {
                allRoles.Add(kvp.Key);
                allRoles.AddRange(kvp.Value);
            }
            settings.AvailableRoles = string.Join(",", allRoles.Where(r => !string.IsNullOrWhiteSpace(r)).Distinct());

            await _context.SaveChangesAsync();
            return Ok(groups);
        }
    }

    public class UpdateSettingsDto
    {
        public string? CollaName { get; set; }
        public string? PrimaryColor { get; set; }
        public string? LogoUrl { get; set; }
    }
}
