using System.ComponentModel.DataAnnotations;

namespace CollaGegantera.Shared.Models
{
    public class FamilyMemberRole
    {
        public string Id { get; set; } = System.Guid.NewGuid().ToString();
        
        [Required]
        public string FamilyGroupId { get; set; } = string.Empty;
        
        [Required]
        public string UserId { get; set; } = string.Empty;
        
        [Required]
        public string Role { get; set; } = string.Empty;
        
        public bool HasAccount { get; set; } = true;
        
        public string? Nom { get; set; }
        
        public string? Cognoms { get; set; }
        
        public string? Email { get; set; }
    }
}
