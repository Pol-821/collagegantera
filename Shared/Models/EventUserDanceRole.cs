using System.Text.Json.Serialization;

namespace CollaGegantera.Shared.Models
{
    public class EventUserDanceRole
    {
        public string EventId { get; set; } = string.Empty;
        [JsonIgnore]
        public virtual Event? Event { get; set; }

        public string AppUserId { get; set; } = string.Empty;
        [JsonIgnore]
        public virtual AppUser? AppUser { get; set; }

        public string DanceRoleId { get; set; } = string.Empty;
        [JsonIgnore]
        public virtual DanceRole? DanceRole { get; set; }
    }
}