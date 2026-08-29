using Microsoft.AspNetCore.Identity;
using System;

namespace CollaGegantera.Shared.Models
{
    public class AppUser : IdentityUser
    {
        public string Nom { get; set; } = string.Empty;
        
        public string Cognoms { get; set; } = string.Empty;
        
        public DateTime DataNaixement { get; set; }

        public string FamilyGroupId { get; set; } = string.Empty;
        public virtual FamilyGroup? FamilyGroup { get; set; }

        public string? AvatarUrl { get; set; }
        
        public string? EncryptedFamilyRole { get; set; }
        
        public bool IsFamilyHead { get; set; }

        public bool NotificationsEnabled { get; set; } = true;
    }
}
