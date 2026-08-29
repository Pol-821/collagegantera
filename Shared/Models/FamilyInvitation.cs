using System.ComponentModel.DataAnnotations;

namespace CollaGegantera.Shared.Models
{
    public class FamilyInvitation
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string FamilyGroupId { get; set; } = string.Empty;

        [Required]
        public string InvitedByUserId { get; set; } = string.Empty;

        [Required]
        public string TargetUserId { get; set; } = string.Empty;

        [Required]
        public string Role { get; set; } = string.Empty;

        public string Status { get; set; } = "Pending"; // Pending, Accepted, Rejected

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? RespondedAt { get; set; }
    }
}
