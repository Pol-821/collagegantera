using System.Text.Json.Serialization;

namespace CollaGegantera.Shared.Models
{
    public class DanceRoleMaterial
    {
        public string DanceRoleId { get; set; } = string.Empty;
        [JsonIgnore]
        public virtual DanceRole? DanceRole { get; set; }

        public string RequiredMaterialId { get; set; } = string.Empty;
        [JsonIgnore]
        public virtual RequiredMaterial? RequiredMaterial { get; set; }

        public int Quantitat { get; set; } = 1;
    }
}