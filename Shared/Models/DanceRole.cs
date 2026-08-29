using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace CollaGegantera.Shared.Models
{
    public class DanceRole
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string Nom { get; set; } = string.Empty;

        [Required]
        public string DanceId { get; set; } = string.Empty;

        [JsonIgnore]
        public virtual Dance? Dance { get; set; }

        [JsonIgnore]
        public ICollection<DanceRoleMaterial> RequiredMaterials { get; set; } = new List<DanceRoleMaterial>();

        [JsonIgnore]
        public ICollection<EventUserDanceRole> EventAssignments { get; set; } = new List<EventUserDanceRole>();
    }
}