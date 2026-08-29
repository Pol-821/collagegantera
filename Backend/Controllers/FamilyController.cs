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
    public class FamilyController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<AppUser> _userManager;
        private readonly IConfiguration _configuration;
        private readonly NotificationService _notificationService;

        public FamilyController(
            ApplicationDbContext context,
            UserManager<AppUser> userManager,
            IConfiguration configuration,
            NotificationService notificationService)
        {
            _context = context;
            _userManager = userManager;
            _configuration = configuration;
            _notificationService = notificationService;
        }

        [HttpGet("my")]
        public async Task<IActionResult> GetMyFamily()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return NotFound();

            var members = await _context.Users
                .Where(u => u.FamilyGroupId == user.FamilyGroupId)
                .Select(u => new
                {
                    u.Id,
                    u.Nom,
                    u.Cognoms,
                    u.AvatarUrl,
                    EncryptedFamilyRole = u.EncryptedFamilyRole,
                    u.IsFamilyHead
                })
                .ToListAsync();

            var familyGroup = await _context.FamilyGroups
                .Where(f => f.Id == user.FamilyGroupId)
                .Select(f => new { f.Id, f.NomFamilia, f.ParentUserId })
                .FirstOrDefaultAsync();

            var familyMemberRoles = await _context.FamilyMemberRoles
                .Where(fmr => fmr.FamilyGroupId == user.FamilyGroupId)
                .ToListAsync();

            var headUserId = familyGroup?.ParentUserId;
            var displayRoles = familyMemberRoles
                .Where(fmr => fmr.UserId != headUserId)
                .ToList();

            var nonAccountMembers = familyMemberRoles
                .Where(fmr => !fmr.HasAccount)
                .Select(fmr => new
                {
                    Id = fmr.UserId,
                    Nom = fmr.Nom ?? "(Sense nom)",
                    Cognoms = fmr.Cognoms ?? "",
                    AvatarUrl = (string?)null,
                    EncryptedFamilyRole = (string?)null,
                    IsFamilyHead = false
                })
                .ToList();

            var allMembers = members.Concat(nonAccountMembers).ToList();

            return Ok(new
            {
                FamilyGroup = familyGroup,
                Members = allMembers,
                Roles = displayRoles
            });
        }

        [HttpGet("members")]
        public async Task<IActionResult> GetFamilyMembers()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return NotFound();

            var members = await _context.Users
                .Where(u => u.FamilyGroupId == user.FamilyGroupId)
                .Select(u => new
                {
                    u.Id,
                    u.Nom,
                    u.Cognoms,
                    u.Email,
                    u.AvatarUrl,
                    u.IsFamilyHead
                })
                .ToListAsync();

            var familyMemberRoles = await _context.FamilyMemberRoles
                .Where(fmr => fmr.FamilyGroupId == user.FamilyGroupId && fmr.HasAccount)
                .ToListAsync();

            var nonAccountMembers = await _context.FamilyMemberRoles
                .Where(fmr => fmr.FamilyGroupId == user.FamilyGroupId && !fmr.HasAccount)
                .Select(fmr => new
                {
                    Id = fmr.UserId,
                    Nom = fmr.Nom ?? "(Sense nom)",
                    Cognoms = fmr.Cognoms ?? "",
                    Email = fmr.Email ?? "",
                    AvatarUrl = (string?)null,
                    IsFamilyHead = false
                })
                .ToListAsync();

            var allMembers = members.Cast<object>().Concat(nonAccountMembers.Cast<object>()).ToList();
            return Ok(allMembers);
        }

        [HttpPut("role")]
        public async Task<IActionResult> UpdateFamilyRole([FromBody] UpdateFamilyRoleDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var currentUser = await _userManager.FindByIdAsync(userId);
            if (currentUser == null) return NotFound();

            var targetUser = await _userManager.FindByIdAsync(dto.UserId);
            if (targetUser == null) return NotFound("Usuari no trobat.");

            if (targetUser.FamilyGroupId != currentUser.FamilyGroupId)
                return Forbid();

            targetUser.EncryptedFamilyRole = EncryptFamilyRole(dto.Role);
            await _userManager.UpdateAsync(targetUser);

            var existingRole = await _context.FamilyMemberRoles
                .FirstOrDefaultAsync(fmr => fmr.UserId == dto.UserId && fmr.FamilyGroupId == currentUser.FamilyGroupId);

            if (existingRole != null)
            {
                existingRole.Role = dto.Role;
            }
            else
            {
                _context.FamilyMemberRoles.Add(new FamilyMemberRole
                {
                    FamilyGroupId = currentUser.FamilyGroupId,
                    UserId = dto.UserId,
                    Role = dto.Role
                });
            }

            await _context.SaveChangesAsync();

            return Ok(new { Message = "Rol familiar actualitzat.", DecryptedRole = dto.Role });
        }

        [HttpGet("tree")]
        public async Task<IActionResult> GetFamilyTree()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var currentUser = await _userManager.FindByIdAsync(userId);
            if (currentUser == null) return NotFound();

            var familyGroup = await _context.FamilyGroups
                .FirstOrDefaultAsync(f => f.Id == currentUser.FamilyGroupId);

            if (familyGroup == null) return NotFound("Grup familiar no trobat.");

            var members = await _context.Users
                .Where(u => u.FamilyGroupId == currentUser.FamilyGroupId)
                .ToListAsync();

            var tree = new Dictionary<string, object>();
            foreach (var member in members)
            {
                var role = !string.IsNullOrEmpty(member.EncryptedFamilyRole)
                    ? DecryptFamilyRole(member.EncryptedFamilyRole)
                    : "Desconegut";

                tree[member.Id] = new
                {
                    member.Id,
                    member.Nom,
                    member.Cognoms,
                    Role = role,
                    member.IsFamilyHead,
                    ParentUserId = familyGroup.ParentUserId,
                    HasAccount = true
                };
            }

            var nonAccountRoles = await _context.FamilyMemberRoles
                .Where(fmr => fmr.FamilyGroupId == currentUser.FamilyGroupId && !fmr.HasAccount)
                .ToListAsync();

            foreach (var fmr in nonAccountRoles)
            {
                tree[fmr.UserId] = new
                {
                    Id = fmr.UserId,
                    Nom = fmr.Nom ?? "(Sense nom)",
                    Cognoms = fmr.Cognoms ?? "",
                    Role = fmr.Role,
                    IsFamilyHead = false,
                    ParentUserId = familyGroup.ParentUserId,
                    HasAccount = false
                };
            }

            return Ok(new
            {
                FamilyGroupNom = familyGroup.NomFamilia,
                ParentUserId = familyGroup.ParentUserId,
                Members = tree
            });
        }

        [HttpPost("reset")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ResetMyFamily()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return NotFound();

            var oldGroupId = user.FamilyGroupId;

            var newGroup = new FamilyGroup
            {
                NomFamilia = "Família " + user.Nom,
                ParentUserId = user.Id
            };
            _context.FamilyGroups.Add(newGroup);
            await _context.SaveChangesAsync();

            user.FamilyGroupId = newGroup.Id;
            user.IsFamilyHead = true;
            user.EncryptedFamilyRole = null;
            await _userManager.UpdateAsync(user);

            if (!string.IsNullOrEmpty(oldGroupId) && oldGroupId != newGroup.Id)
            {
                var oldMembers = await _context.Users
                    .Where(u => u.FamilyGroupId == oldGroupId && u.Id != userId)
                    .ToListAsync();
                foreach (var m in oldMembers)
                {
                    m.FamilyGroupId = newGroup.Id;
                    await _userManager.UpdateAsync(m);
                }

                var oldRoles = await _context.FamilyMemberRoles
                    .Where(fmr => fmr.FamilyGroupId == oldGroupId)
                    .ToListAsync();
                _context.FamilyMemberRoles.RemoveRange(oldRoles);
                await _context.SaveChangesAsync();
            }

            _context.FamilyMemberRoles.Add(new FamilyMemberRole
            {
                FamilyGroupId = newGroup.Id,
                UserId = user.Id,
                Role = "Pare/Mare",
                HasAccount = true,
                Nom = user.Nom,
                Cognoms = user.Cognoms,
                Email = user.Email
            });
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Família reiniciada.", FamilyGroupId = newGroup.Id });
        }

        [HttpPost("member")]
        public async Task<IActionResult> AddMember([FromBody] AddFamilyMemberToTreeDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var currentUser = await _userManager.FindByIdAsync(userId);
            if (currentUser == null) return NotFound();

            if (!currentUser.IsFamilyHead)
                return StatusCode(403, new { Message = "Només el cap de família pot afegir membres." });

            if (dto.HasAccount)
            {
                if (string.IsNullOrWhiteSpace(dto.Email))
                    return BadRequest(new { Message = "Cal indicar el correu electrònic per a un membre amb compte." });

                var targetUser = await _userManager.FindByEmailAsync(dto.Email.Trim());
                if (targetUser == null)
                    return NotFound(new { Message = "No s'ha trobat cap usuari amb aquest correu." });

                if (targetUser.Id == userId)
                    return BadRequest(new { Message = "No pots afegir-te a tu mateix." });

                var existingRole = await _context.FamilyMemberRoles
                    .FirstOrDefaultAsync(fmr => fmr.UserId == targetUser.Id && fmr.FamilyGroupId == currentUser.FamilyGroupId);
                if (existingRole != null)
                    return BadRequest(new { Message = $"{targetUser.Nom} {targetUser.Cognoms} ja és membre de la família." });

                var existingInvitation = await _context.FamilyInvitations
                    .FirstOrDefaultAsync(fi => fi.TargetUserId == targetUser.Id
                        && fi.FamilyGroupId == currentUser.FamilyGroupId
                        && fi.Status == "Pending");
                if (existingInvitation != null)
                    return BadRequest(new { Message = $"Ja hi ha una invitació pendent per a {targetUser.Nom} {targetUser.Cognoms}." });

                var invitation = new FamilyInvitation
                {
                    FamilyGroupId = currentUser.FamilyGroupId,
                    InvitedByUserId = userId,
                    TargetUserId = targetUser.Id,
                    Role = dto.Role,
                };
                _context.FamilyInvitations.Add(invitation);
                await _context.SaveChangesAsync();

                await _notificationService.SendAsync(
                    targetUser.Id,
                    "Invitació familiar",
                    $"{currentUser.Nom} {currentUser.Cognoms} et convida a unir-te a la seva família com a \"{dto.Role}\". Accepta o rebutja la invitació.");

                return Ok(new { Message = $"Invitació enviada a {targetUser.Nom} {targetUser.Cognoms}.", InvitationId = invitation.Id });
            }
            else
            {
                var familyRole = new FamilyMemberRole
                {
                    FamilyGroupId = currentUser.FamilyGroupId,
                    UserId = Guid.NewGuid().ToString(),
                    Role = dto.Role,
                    HasAccount = false,
                    Nom = dto.Nom ?? "",
                    Cognoms = dto.Cognoms ?? "",
                    Email = dto.Email
                };
                _context.FamilyMemberRoles.Add(familyRole);
                await _context.SaveChangesAsync();
                return Ok(new { Message = "Membre familiar afegit." });
            }
        }

        [HttpPost("invitation/{invitationId}/accept")]
        public async Task<IActionResult> AcceptInvitation(string invitationId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var invitation = await _context.FamilyInvitations.FindAsync(invitationId);
            if (invitation == null) return NotFound();
            if (invitation.TargetUserId != userId) return Forbid();
            if (invitation.Status != "Pending") return BadRequest(new { Message = "L'invitació ja ha estat processada." });

            var targetUser = await _userManager.FindByIdAsync(userId);
            if (targetUser == null) return NotFound();

            var oldGroupId = targetUser.FamilyGroupId;

            targetUser.FamilyGroupId = invitation.FamilyGroupId;
            targetUser.EncryptedFamilyRole = EncryptFamilyRole(invitation.Role);
            targetUser.IsFamilyHead = false;
            await _userManager.UpdateAsync(targetUser);

            _context.FamilyMemberRoles.Add(new FamilyMemberRole
            {
                FamilyGroupId = invitation.FamilyGroupId,
                UserId = userId,
                Role = invitation.Role,
                HasAccount = true,
                Nom = targetUser.Nom,
                Cognoms = targetUser.Cognoms,
                Email = targetUser.Email
            });

            invitation.Status = "Accepted";
            invitation.RespondedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var inviter = await _userManager.FindByIdAsync(invitation.InvitedByUserId);
            if (inviter != null)
            {
                await _notificationService.SendAsync(
                    invitation.InvitedByUserId,
                    "Invitació acceptada",
                    $"{targetUser.Nom} {targetUser.Cognoms} ha acceptat la teva invitació familiar.");
            }

            // Check if old family has any other account members
            var hasOldFamily = !string.IsNullOrEmpty(oldGroupId) && oldGroupId != invitation.FamilyGroupId;
            var otherAccountMembersInOld = 0;
            List<object>? migrationCandidatesInOld = null;

            if (hasOldFamily)
            {
                otherAccountMembersInOld = await _context.Users
                    .CountAsync(u => u.FamilyGroupId == oldGroupId && u.Id != userId);

                var migrateRoles = await _context.FamilyMemberRoles
                    .Where(fmr => fmr.FamilyGroupId == oldGroupId
                        && fmr.UserId != userId)
                    .ToListAsync();

                migrationCandidatesInOld = migrateRoles.Select(fmr => (object)new
                {
                    fmr.UserId,
                    fmr.Nom,
                    fmr.Cognoms,
                    fmr.Role,
                    fmr.Email,
                    fmr.HasAccount
                }).ToList();
            }

            return Ok(new
            {
                Message = "Invitació acceptada. Ja formes part de la família.",
                NeedsMigration = hasOldFamily && migrationCandidatesInOld != null && migrationCandidatesInOld.Count > 0,
                OtherAccountMembersCount = otherAccountMembersInOld,
                NonAccountMembers = migrationCandidatesInOld ?? new List<object>(),
                OldFamilyGroupId = hasOldFamily ? oldGroupId : null,
                NewFamilyGroupId = invitation.FamilyGroupId
            });
        }

        [HttpPost("invitation/{invitationId}/reject")]
        public async Task<IActionResult> RejectInvitation(string invitationId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var invitation = await _context.FamilyInvitations.FindAsync(invitationId);
            if (invitation == null) return NotFound();
            if (invitation.TargetUserId != userId) return Forbid();
            if (invitation.Status != "Pending") return BadRequest(new { Message = "L'invitació ja ha estat processada." });

            invitation.Status = "Rejected";
            invitation.RespondedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Invitació rebutjada." });
        }

        [HttpGet("invitations")]
        public async Task<IActionResult> GetMyInvitations()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var invitations = await _context.FamilyInvitations
                .Where(fi => fi.TargetUserId == userId && fi.Status == "Pending")
                .ToListAsync();

            var result = new List<object>();
            foreach (var inv in invitations)
            {
                var inviter = await _userManager.FindByIdAsync(inv.InvitedByUserId);
                var familyGroup = await _context.FamilyGroups.FindAsync(inv.FamilyGroupId);
                result.Add(new
                {
                    inv.Id,
                    InviterName = inviter != null ? $"{inviter.Nom} {inviter.Cognoms}" : "Desconegut",
                    FamilyName = familyGroup?.NomFamilia ?? "Família",
                    inv.Role,
                    inv.CreatedAt,
                });
            }

            return Ok(result);
        }

        [HttpGet("migration-candidates")]
        public async Task<IActionResult> GetMigrationCandidates()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return NotFound();

            var roles = await _context.FamilyMemberRoles
                .Where(fmr => fmr.FamilyGroupId == user.FamilyGroupId && fmr.UserId != userId)
                .Select(fmr => new
                {
                    fmr.UserId,
                    fmr.Nom,
                    fmr.Cognoms,
                    fmr.Role,
                    fmr.Email,
                    fmr.HasAccount
                })
                .ToListAsync();

            return Ok(roles);
        }

        [HttpPost("migrate")]
        public async Task<IActionResult> MigrateFamilyMembers([FromBody] MigrateFamilyDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return NotFound();

            var currentGroupId = !string.IsNullOrEmpty(dto.SourceFamilyGroupId)
                ? dto.SourceFamilyGroupId
                : user.FamilyGroupId;
            if (string.IsNullOrEmpty(currentGroupId))
                return BadRequest(new { Message = "No tens cap grup familiar actual." });

            // Get all migration-eligible members from current family (excluding self)
            var allRoles = await _context.FamilyMemberRoles
                .Where(fmr => fmr.FamilyGroupId == currentGroupId && fmr.UserId != userId)
                .ToListAsync();

            if (dto.MigrateMemberIds != null && dto.MigrateMemberIds.Count > 0)
            {
                var toMigrate = allRoles
                    .Where(fmr => dto.MigrateMemberIds.Contains(fmr.UserId))
                    .ToList();

                foreach (var member in toMigrate)
                {
                    member.FamilyGroupId = dto.TargetFamilyGroupId;

                    // If linked account, also update the actual user's FamilyGroupId
                    if (member.HasAccount)
                    {
                        var linkedUser = await _userManager.FindByIdAsync(member.UserId);
                        if (linkedUser != null)
                        {
                            linkedUser.FamilyGroupId = dto.TargetFamilyGroupId;
                            linkedUser.EncryptedFamilyRole = EncryptFamilyRole(member.Role);
                            linkedUser.IsFamilyHead = false;
                            await _userManager.UpdateAsync(linkedUser);
                        }
                    }
                }

                // Delete non-selected members
                var toDelete = allRoles
                    .Where(fmr => !dto.MigrateMemberIds.Contains(fmr.UserId))
                    .ToList();

                foreach (var member in toDelete)
                {
                    var registrations = await _context.EventRegistrations
                        .Where(r => r.UserId == member.UserId)
                        .ToListAsync();
                    _context.EventRegistrations.RemoveRange(registrations);
                }

                _context.FamilyMemberRoles.RemoveRange(toDelete);
            }
            else
            {
                foreach (var member in allRoles)
                {
                    var registrations = await _context.EventRegistrations
                        .Where(r => r.UserId == member.UserId)
                        .ToListAsync();
                    _context.EventRegistrations.RemoveRange(registrations);
                }

                _context.FamilyMemberRoles.RemoveRange(allRoles);
            }

            // Check if old family has any other account users
            var otherAccountUsers = await _context.Users
                .Where(u => u.FamilyGroupId == currentGroupId && u.Id != userId)
                .ToListAsync();

            if (otherAccountUsers.Count == 0)
            {
                var oldFamilyGroup = await _context.FamilyGroups.FindAsync(currentGroupId);
                if (oldFamilyGroup != null && oldFamilyGroup.ParentUserId != dto.TargetFamilyGroupId)
                {
                    _context.FamilyGroups.Remove(oldFamilyGroup);
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Migració completada." });
        }

        [HttpPost("leave")]
        public async Task<IActionResult> LeaveFamily([FromBody] LeaveFamilyDto? dto = null)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return NotFound();

            var currentGroupId = user.FamilyGroupId;
            if (string.IsNullOrEmpty(currentGroupId))
                return BadRequest(new { Message = "No tens cap grup familiar." });

            var wasHead = user.IsFamilyHead;

            // Remove FamilyMemberRole
            var memberRole = await _context.FamilyMemberRoles
                .FirstOrDefaultAsync(fmr => fmr.UserId == userId && fmr.FamilyGroupId == currentGroupId);
            if (memberRole != null)
                _context.FamilyMemberRoles.Remove(memberRole);

            // Migrate non-account members if requested
            if (dto?.MigrateMemberIds != null && dto.MigrateMemberIds.Count > 0)
            {
                // Create new family for the user
                var newFamily = new FamilyGroup
                {
                    NomFamilia = $"Família de {user.Nom} {user.Cognoms}",
                    ParentUserId = user.Id
                };
                _context.FamilyGroups.Add(newFamily);
                await _context.SaveChangesAsync();

                user.FamilyGroupId = newFamily.Id;
                user.IsFamilyHead = true;
                user.EncryptedFamilyRole = null;
                await _userManager.UpdateAsync(user);

                _context.FamilyMemberRoles.Add(new FamilyMemberRole
                {
                    FamilyGroupId = newFamily.Id,
                    UserId = userId,
                    Role = "Pare/Mare",
                    HasAccount = true,
                    Nom = user.Nom,
                    Cognoms = user.Cognoms,
                    Email = user.Email
                });

                // Migrate selected non-account members
                var rolesToMigrate = await _context.FamilyMemberRoles
                    .Where(fmr => fmr.FamilyGroupId == currentGroupId
                        && !fmr.HasAccount
                        && dto.MigrateMemberIds.Contains(fmr.UserId))
                    .ToListAsync();

                foreach (var r in rolesToMigrate)
                    r.FamilyGroupId = newFamily.Id;

                // Delete non-selected non-account members
                var rolesToDelete = await _context.FamilyMemberRoles
                    .Where(fmr => fmr.FamilyGroupId == currentGroupId
                        && !fmr.HasAccount
                        && !dto.MigrateMemberIds.Contains(fmr.UserId))
                    .ToListAsync();

                foreach (var r in rolesToDelete)
                {
                    var regs = await _context.EventRegistrations.Where(er => er.UserId == r.UserId).ToListAsync();
                    _context.EventRegistrations.RemoveRange(regs);
                }
                _context.FamilyMemberRoles.RemoveRange(rolesToDelete);
            }
            else
            {
                var newFamily = new FamilyGroup
                {
                    NomFamilia = $"Família de {user.Nom} {user.Cognoms}",
                    ParentUserId = user.Id
                };
                _context.FamilyGroups.Add(newFamily);
                await _context.SaveChangesAsync();

                user.FamilyGroupId = newFamily.Id;
                user.IsFamilyHead = true;
                user.EncryptedFamilyRole = null;
                await _userManager.UpdateAsync(user);

                _context.FamilyMemberRoles.Add(new FamilyMemberRole
                {
                    FamilyGroupId = newFamily.Id,
                    UserId = userId,
                    Role = "Pare/Mare",
                    HasAccount = true,
                    Nom = user.Nom,
                    Cognoms = user.Cognoms,
                    Email = user.Email
                });
            }

            // If the leaving user was the head, assign a new head from remaining account users
            if (wasHead)
            {
                var newHeadUser = await _context.Users
                    .Where(u => u.FamilyGroupId == currentGroupId && u.Id != userId)
                    .FirstOrDefaultAsync();

                if (newHeadUser != null)
                {
                    newHeadUser.IsFamilyHead = true;
                    newHeadUser.EncryptedFamilyRole = null;
                    await _userManager.UpdateAsync(newHeadUser);

                    var familyGroup = await _context.FamilyGroups.FindAsync(currentGroupId);
                    if (familyGroup != null)
                        familyGroup.ParentUserId = newHeadUser.Id;

                    await _notificationService.SendAsync(
                        newHeadUser.Id,
                        "Nou cap de família",
                        $"{user.Nom} {user.Cognoms} ha abandonat la família. Ara ets el nou cap de família de {familyGroup?.NomFamilia}.");
                }
            }

            // Clean up empty family group only if no members at all remain
            var otherAccountUsers = await _context.Users
                .Where(u => u.FamilyGroupId == currentGroupId && u.Id != userId)
                .ToListAsync();

            var remainingNonAccountRoles = await _context.FamilyMemberRoles
                .Where(fmr => fmr.FamilyGroupId == currentGroupId)
                .CountAsync();

            if (otherAccountUsers.Count == 0 && remainingNonAccountRoles == 0)
            {
                var oldFamilyGroup = await _context.FamilyGroups.FindAsync(currentGroupId);
                if (oldFamilyGroup != null)
                    _context.FamilyGroups.Remove(oldFamilyGroup);
            }

            // Cancel pending invitations
            var pendingInvites = await _context.FamilyInvitations
                .Where(fi => fi.FamilyGroupId == currentGroupId && fi.Status == "Pending")
                .ToListAsync();
            _context.FamilyInvitations.RemoveRange(pendingInvites);

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Has abandonat la família." });
        }

        [HttpPost("transfer-head")]
        public async Task<IActionResult> TransferHead([FromBody] TransferHeadDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var currentUser = await _userManager.FindByIdAsync(userId);
            if (currentUser == null) return NotFound();

            if (!currentUser.IsFamilyHead)
                return StatusCode(403, new { Message = "Només el cap de família pot transferir el rol." });

            var targetUser = await _userManager.FindByIdAsync(dto.TargetUserId);
            if (targetUser == null)
                return NotFound(new { Message = "Usuari no trobat." });

            if (targetUser.FamilyGroupId != currentUser.FamilyGroupId)
                return BadRequest(new { Message = "L'usuari no pertany a la teva família." });

            var targetMemberRole = await _context.FamilyMemberRoles
                .FirstOrDefaultAsync(fmr => fmr.UserId == dto.TargetUserId && fmr.FamilyGroupId == currentUser.FamilyGroupId);

            if (targetMemberRole == null)
                return BadRequest(new { Message = "L'usuari no és membre de la família." });

            currentUser.IsFamilyHead = false;
            var oldHeadRole = await _context.FamilyMemberRoles
                .FirstOrDefaultAsync(fmr => fmr.UserId == userId && fmr.FamilyGroupId == currentUser.FamilyGroupId);
            if (oldHeadRole != null)
                currentUser.EncryptedFamilyRole = EncryptFamilyRole(oldHeadRole.Role);
            await _userManager.UpdateAsync(currentUser);

            targetUser.IsFamilyHead = true;
            targetUser.EncryptedFamilyRole = null;
            await _userManager.UpdateAsync(targetUser);

            if (currentUser.FamilyGroupId != null)
            {
                var familyGroup = await _context.FamilyGroups.FindAsync(currentUser.FamilyGroupId);
                if (familyGroup != null && familyGroup.ParentUserId == userId)
                {
                    familyGroup.ParentUserId = dto.TargetUserId;
                }
            }

            await _context.SaveChangesAsync();

            await _notificationService.SendAsync(
                dto.TargetUserId,
                "Cap de família",
                $"{currentUser.Nom} {currentUser.Cognoms} t'ha transferit el rol de cap de família.");

            return Ok(new { Message = $"S'ha transferit el rol de cap de família a {targetUser.Nom} {targetUser.Cognoms}." });
        }

        [HttpDelete("member/{userId}")]
        public async Task<IActionResult> RemoveMember(string userId)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (currentUserId == null) return Unauthorized();

            var currentUser = await _userManager.FindByIdAsync(currentUserId);
            if (currentUser == null) return NotFound();

            if (!currentUser.IsFamilyHead)
                return StatusCode(403, new { Message = "Només el cap de família pot eliminar membres." });

            if (userId == currentUserId)
                return BadRequest(new { Message = "No pots eliminar-te a tu mateix." });

            var familyMemberRole = await _context.FamilyMemberRoles
                .FirstOrDefaultAsync(fmr => fmr.UserId == userId && fmr.FamilyGroupId == currentUser.FamilyGroupId);

            if (familyMemberRole != null)
            {
                _context.FamilyMemberRoles.Remove(familyMemberRole);

                var registrations = await _context.EventRegistrations
                    .Where(r => r.UserId == userId)
                    .ToListAsync();
                _context.EventRegistrations.RemoveRange(registrations);
            }

            var targetUser = await _userManager.FindByIdAsync(userId);
            if (targetUser != null && targetUser.FamilyGroupId == currentUser.FamilyGroupId)
            {
                // Create a new personal family group for the removed user
                var newFamily = new FamilyGroup
                {
                    NomFamilia = $"Família de {targetUser.Nom} {targetUser.Cognoms}",
                    ParentUserId = targetUser.Id
                };
                _context.FamilyGroups.Add(newFamily);
                await _context.SaveChangesAsync();

                targetUser.FamilyGroupId = newFamily.Id;
                targetUser.IsFamilyHead = true;
                targetUser.EncryptedFamilyRole = null;
                await _userManager.UpdateAsync(targetUser);

                _context.FamilyMemberRoles.Add(new FamilyMemberRole
                {
                    FamilyGroupId = newFamily.Id,
                    UserId = targetUser.Id,
                    Role = "Pare/Mare",
                    HasAccount = true,
                    Nom = targetUser.Nom,
                    Cognoms = targetUser.Cognoms,
                    Email = targetUser.Email
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Membre eliminat del grup familiar." });
        }

        [HttpPut("member")]
        public async Task<IActionResult> UpdateMember([FromBody] UpdateMemberDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var currentUser = await _userManager.FindByIdAsync(userId);
            if (currentUser == null) return NotFound();

            if (!currentUser.IsFamilyHead)
                return StatusCode(403, new { Message = "Només el cap de família pot editar membres." });

            var familyMemberRole = await _context.FamilyMemberRoles
                .FirstOrDefaultAsync(fmr => fmr.UserId == dto.UserId && fmr.FamilyGroupId == currentUser.FamilyGroupId);

            if (familyMemberRole == null)
                return NotFound("Membre no trobat al grup familiar.");

            if (!string.IsNullOrEmpty(dto.Nom))
                familyMemberRole.Nom = dto.Nom;

            if (!string.IsNullOrEmpty(dto.Cognoms))
                familyMemberRole.Cognoms = dto.Cognoms;

            if (!string.IsNullOrEmpty(dto.Role))
                familyMemberRole.Role = dto.Role;

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Informació del membre actualitzada." });
        }

        [HttpPost("member/link")]
        public async Task<IActionResult> LinkAccount([FromBody] LinkAccountDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var currentUser = await _userManager.FindByIdAsync(userId);
            if (currentUser == null) return NotFound();

            if (!currentUser.IsFamilyHead)
                return StatusCode(403, new { Message = "Només el cap de família pot vincular comptes." });

            var targetUser = await _userManager.FindByEmailAsync(dto.Email);
            if (targetUser == null) return NotFound("Usuari no trobat amb aquest correu.");

            var familyMemberRole = await _context.FamilyMemberRoles
                .FirstOrDefaultAsync(fmr => fmr.UserId == dto.FamilyMemberUserId && fmr.FamilyGroupId == currentUser.FamilyGroupId);

            if (familyMemberRole == null)
                return NotFound("Membre familiar no trobat.");

            familyMemberRole.HasAccount = true;
            familyMemberRole.UserId = targetUser.Id;
            familyMemberRole.Email = targetUser.Email;
            familyMemberRole.Nom = targetUser.Nom;
            familyMemberRole.Cognoms = targetUser.Cognoms;

            targetUser.FamilyGroupId = currentUser.FamilyGroupId;
            targetUser.EncryptedFamilyRole = EncryptFamilyRole(familyMemberRole.Role);

            await _userManager.UpdateAsync(targetUser);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Compte vinculat correctament." });
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

    public class UpdateFamilyRoleDto
    {
        public string UserId { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }

    public class AddFamilyMemberToTreeDto
    {
        public string? UserId { get; set; }
        public string Role { get; set; } = string.Empty;
        public bool HasAccount { get; set; } = true;
        public string? Nom { get; set; }
        public string? Cognoms { get; set; }
        public string? Email { get; set; }
    }

    public class UpdateMemberDto
    {
        public string UserId { get; set; } = string.Empty;
        public string? Nom { get; set; }
        public string? Cognoms { get; set; }
        public string? Role { get; set; }
    }

    public class LinkAccountDto
    {
        public string Email { get; set; } = string.Empty;
        public string FamilyMemberUserId { get; set; } = string.Empty;
    }

    public class MigrateFamilyDto
    {
        public string TargetFamilyGroupId { get; set; } = string.Empty;
        public string? SourceFamilyGroupId { get; set; }
        public List<string>? MigrateMemberIds { get; set; }
    }

    public class LeaveFamilyDto
    {
        public List<string>? MigrateMemberIds { get; set; }
    }

    public class TransferHeadDto
    {
        public string TargetUserId { get; set; } = string.Empty;
    }
}
