using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace CollaGegantera.Shared.Models
{
    public class RequiredMaterial
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string Nom { get; set; } = string.Empty; 

        public string Descripcio { get; set; } = string.Empty;

        [JsonIgnore]
        public ICollection<DanceRoleMaterial> RoleMaterials { get; set; } = new List<DanceRoleMaterial>();
    }
}