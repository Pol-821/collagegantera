using CollaGegantera.Api.Data;
using CollaGegantera.Api.Services;
using CollaGegantera.Shared.DTOs;
using CollaGegantera.Shared.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace CollaGegantera.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly GoogleDriveService _driveService;

        public AuthController(UserManager<AppUser> userManager, ApplicationDbContext context, IConfiguration configuration, GoogleDriveService driveService)
        {
            _userManager = userManager;
            _context = context;
            _configuration = configuration;
            _driveService = driveService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            // Validació del codi de la colla
            var collaCode = _configuration["CollaCode"];
            if (string.IsNullOrEmpty(collaCode) || dto.CodiColla != collaCode)
            {
                return BadRequest(new { Message = "El codi de la colla no és vàlid." });
            }

            var existingUser = await _userManager.FindByEmailAsync(dto.Email);
            if (existingUser != null) return BadRequest(new { Message = "L'email ja està registrat." });

            var novaFamilia = new FamilyGroup
            {
                NomFamilia = string.IsNullOrWhiteSpace(dto.NomFamilia) 
                             ? $"Família de {dto.Nom} {dto.Cognoms}" : dto.NomFamilia
            };
            
            _context.FamilyGroups.Add(novaFamilia);
            await _context.SaveChangesAsync();

            var nouUsuari = new AppUser
            {
                UserName = dto.Email,
                Email = dto.Email,
                Nom = dto.Nom,
                Cognoms = dto.Cognoms,
                DataNaixement = dto.DataNaixement,
                FamilyGroupId = novaFamilia.Id 
            };

            var result = await _userManager.CreateAsync(nouUsuari, dto.Password);
            
            if (!result.Succeeded) 
            {
                _context.FamilyGroups.Remove(novaFamilia);
                await _context.SaveChangesAsync();
                return BadRequest(result.Errors);
            }

            await _userManager.AddToRoleAsync(nouUsuari, "GeganterBase");

            var userRoles = await _userManager.GetRolesAsync(nouUsuari);
            var authClaims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, nouUsuari.Id),
                new Claim(ClaimTypes.Email, nouUsuari.Email!),
                new Claim("FamilyGroupId", nouUsuari.FamilyGroupId)
            };
            foreach (var userRole in userRoles)
                authClaims.Add(new Claim(ClaimTypes.Role, userRole));

            var jwtSettings = _configuration.GetSection("Jwt");
            var authSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(jwtSettings["Key"]!));
            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                expires: DateTime.Now.AddDays(7),
                claims: authClaims,
                signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
            );

            return Ok(new {
                Token = new JwtSecurityTokenHandler().WriteToken(token),
                User = new {
                    Id = nouUsuari.Id,
                    Email = nouUsuari.Email,
                    Nom = nouUsuari.Nom,
                    Cognoms = nouUsuari.Cognoms,
                    Role = "GeganterBase"
                }
            });
        }

        // === NOU: ENDPOINT DE LOGIN (Generació de JWT) ===
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null || !await _userManager.CheckPasswordAsync(user, dto.Password))
            {
                return Unauthorized(new { Message = "Credencials invàlides." });
            }

            var userRoles = await _userManager.GetRolesAsync(user);
            var authClaims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Email, user.Email!),
                // Guardem l'ID de la família dins del token per fer consultes ràpides posteriors
                new Claim("FamilyGroupId", user.FamilyGroupId) 
            };

            foreach (var userRole in userRoles)
            {
                authClaims.Add(new Claim(ClaimTypes.Role, userRole));
            }

            var jwtSettings = _configuration.GetSection("Jwt");
            var authSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(jwtSettings["Key"]!));

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                expires: DateTime.Now.AddDays(7), // Token vàlid durant 7 dies
                claims: authClaims,
                signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
            );

            return Ok(new {
                Token = new JwtSecurityTokenHandler().WriteToken(token),
                Expiration = token.ValidTo,
                User = new {
                    Id = user.Id,
                    Email = user.Email,
                    Nom = user.Nom,
                    Cognoms = user.Cognoms,
                    AvatarUrl = user.AvatarUrl,
                    IsFamilyHead = user.IsFamilyHead,
                    Roles = userRoles.ToList()
                }
            });
        }

        // === NOU: ENDPOINT D'ADDICIÓ DE FAMILIARS ===
        [Authorize] // Exigeix que l'usuari enviï un JWT vàlid
        [HttpPost("add-family-member")]
        public async Task<IActionResult> AddFamilyMember([FromBody] AddFamilyMemberDto dto)
        {
            // Extraiem l'ID de l'usuari que fa la petició des del seu JWT
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (currentUserId == null) return Unauthorized();

            var currentUser = await _userManager.FindByIdAsync(currentUserId);
            if (currentUser == null) return NotFound("Usuari no trobat.");

            // Estratègia per crear un usuari secundari sense email real:
            // Generem un email fictici basat en l'ID del grup familiar
            var fakeEmail = $"{dto.Nom.ToLower().Replace(" ", "")}.{Guid.NewGuid().ToString().Substring(0, 5)}@familiar.local";

            var nouFamiliar = new AppUser
            {
                UserName = fakeEmail,
                Email = fakeEmail,
                Nom = dto.Nom,
                Cognoms = dto.Cognoms,
                DataNaixement = dto.DataNaixement,
                FamilyGroupId = currentUser.FamilyGroupId // Lliguem al menor/dependent a la família de l'administrador
            };

            // Assignem una contrasenya per defecte i complexa (que no s'utilitzarà mai perquè iniciaran sessió a través de l'administrador)
            var result = await _userManager.CreateAsync(nouFamiliar, "DependentUser_2026!");

            if (!result.Succeeded) return BadRequest(result.Errors);

            await _userManager.AddToRoleAsync(nouFamiliar, "GeganterBase");

            return Ok(new { Message = "Familiar afegit correctament a la teva unitat familiar." });
        }
        [Authorize]
        [HttpGet("my-family")]
        public async Task<IActionResult> GetMyFamily()
        {
            var familyGroupId = User.FindFirst("FamilyGroupId")?.Value;
            if (string.IsNullOrEmpty(familyGroupId)) return Ok(new List<FamilyMemberDto>());

            // Extraiem només l'ID i el nom per no saturar la memòria (Tasca 5.4 mindset)
            var members = await _context.Users
                .Where(u => u.FamilyGroupId == familyGroupId)
                .Select(u => new FamilyMemberDto 
                { 
                    Id = u.Id, 
                    Nom = u.Nom, 
                    Cognoms = u.Cognoms 
                })
                .ToListAsync();

            return Ok(members);
        }

        [Authorize]
        [HttpPost("avatar")]
        public async Task<IActionResult> UploadAvatar(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { Message = "Cap arxiu seleccionat." });

            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (currentUserId == null) return Unauthorized();

            var currentUser = await _userManager.FindByIdAsync(currentUserId);
            if (currentUser == null) return NotFound("Usuari no trobat.");

            if (!string.IsNullOrEmpty(currentUser.AvatarUrl))
                await _driveService.DeleteFileByUrlAsync(currentUser.AvatarUrl);

            var ext = Path.GetExtension(file.FileName);
            var fileName = $"avatar_{currentUserId}{ext}";

            using var stream = new MemoryStream();
            await file.CopyToAsync(stream);
            stream.Position = 0;

            var avatarUrl = await _driveService.UploadImageAsync(stream, fileName, file.ContentType, isAvatar: true);

            currentUser.AvatarUrl = avatarUrl;
            await _userManager.UpdateAsync(currentUser);

            return Ok(new { AvatarUrl = avatarUrl });
        }

        [Authorize]
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (currentUserId == null) return Unauthorized();

            var user = await _userManager.FindByIdAsync(currentUserId);
            if (user == null) return NotFound("Usuari no trobat.");

            var roles = await _userManager.GetRolesAsync(user);

            return Ok(new
            {
                user.Id,
                user.Email,
                user.Nom,
                user.Cognoms,
                user.DataNaixement,
                user.AvatarUrl,
                user.NotificationsEnabled,
                user.IsFamilyHead,
                Roles = roles.ToList()
            });
        }

        [Authorize]
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (currentUserId == null) return Unauthorized();

            var user = await _userManager.FindByIdAsync(currentUserId);
            if (user == null) return NotFound("Usuari no trobat.");

            if (!string.IsNullOrWhiteSpace(dto.Nom))
                user.Nom = dto.Nom;
            if (!string.IsNullOrWhiteSpace(dto.Cognoms))
                user.Cognoms = dto.Cognoms;
            if (dto.DataNaixement.HasValue)
                user.DataNaixement = dto.DataNaixement.Value;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded) return BadRequest(result.Errors);

            var roles = await _userManager.GetRolesAsync(user);

            return Ok(new
            {
                user.Id,
                user.Email,
                user.Nom,
                user.Cognoms,
                user.DataNaixement,
                user.AvatarUrl,
                user.NotificationsEnabled,
                user.IsFamilyHead,
                Roles = roles.ToList()
            });
        }

        [Authorize]
        [HttpPut("profile/notifications")]
        public async Task<IActionResult> ToggleNotifications([FromBody] ToggleNotificationsDto dto)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (currentUserId == null) return Unauthorized();

            var user = await _userManager.FindByIdAsync(currentUserId);
            if (user == null) return NotFound("Usuari no trobat.");

            user.NotificationsEnabled = dto.Enabled;
            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded) return BadRequest(result.Errors);

            return Ok(new { NotificationsEnabled = user.NotificationsEnabled });
        }

        [Authorize]
        [HttpDelete("profile")]
        public async Task<IActionResult> DeleteAccount([FromBody] DeleteAccountDto dto)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (currentUserId == null) return Unauthorized();

            var user = await _userManager.FindByIdAsync(currentUserId);
            if (user == null) return NotFound("Usuari no trobat.");

            if (string.IsNullOrWhiteSpace(dto.Password))
                return BadRequest(new { Message = "Cal introduir la contrasenya per eliminar el compte." });

            var passwordValid = await _userManager.CheckPasswordAsync(user, dto.Password);
            if (!passwordValid)
                return BadRequest(new { Message = "La contrasenya no és correcta." });

            // Remove related data
            var notifications = _context.Notifications.Where(n => n.UserId == currentUserId);
            _context.Notifications.RemoveRange(notifications);

            var pushSubscriptions = _context.PushSubscriptions.Where(ps => ps.UserId == currentUserId);
            _context.PushSubscriptions.RemoveRange(pushSubscriptions);

            var familyRoles = _context.FamilyMemberRoles.Where(fmr => fmr.UserId == currentUserId);
            _context.FamilyMemberRoles.RemoveRange(familyRoles);

            var familyInvitations = _context.FamilyInvitations
                .Where(fi => fi.InvitedByUserId == currentUserId || fi.TargetUserId == currentUserId);
            _context.FamilyInvitations.RemoveRange(familyInvitations);

            await _context.SaveChangesAsync();

            var deleteResult = await _userManager.DeleteAsync(user);
            if (!deleteResult.Succeeded) return BadRequest(deleteResult.Errors);

            return Ok(new { Message = "Compte eliminat correctament." });
        }

        [Authorize]
        [HttpPut("profile/password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (currentUserId == null) return Unauthorized();

            var user = await _userManager.FindByIdAsync(currentUserId);
            if (user == null) return NotFound("Usuari no trobat.");

            var result = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);
            if (!result.Succeeded) return BadRequest(result.Errors);

            return Ok(new { Message = "Contrasenya canviada correctament." });
        }

        private string EncryptFamilyRole(string role)
        {
            var key = _configuration["Jwt:Key"];
            var encrypted = new char[role.Length];
            for (int i = 0; i < role.Length; i++)
            {
                encrypted[i] = (char)(role[i] ^ key[i % key.Length]);
            }
            return Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(new string(encrypted)));
        }

        private string DecryptFamilyRole(string encrypted)
        {
            var key = _configuration["Jwt:Key"];
            var bytes = Convert.FromBase64String(encrypted);
            var decoded = System.Text.Encoding.UTF8.GetString(bytes);
            var decrypted = new char[decoded.Length];
            for (int i = 0; i < decoded.Length; i++)
            {
                decrypted[i] = (char)(decoded[i] ^ key[i % key.Length]);
            }
            return new string(decrypted);
        }
    }

    public class UpdateProfileDto
    {
        public string? Nom { get; set; }
        public string? Cognoms { get; set; }
        public DateTime? DataNaixement { get; set; }
    }

    public class ChangePasswordDto
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }

    public class ToggleNotificationsDto
    {
        public bool Enabled { get; set; }
    }

    public class DeleteAccountDto
    {
        public string Password { get; set; } = string.Empty;
    }
}