using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace CollaGegantera.Shared.Models
{
    public class FamilyGroup
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string NomFamilia { get; set; } = string.Empty;

        [JsonIgnore]
        public ICollection<AppUser> Membres { get; set; } = new List<AppUser>();

        public string? ParentUserId { get; set; }
    }
}
