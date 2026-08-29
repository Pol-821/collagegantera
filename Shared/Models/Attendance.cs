using System;
using System.Text.Json.Serialization;

namespace CollaGegantera.Shared.Models
{
    public class Attendance
    {
        public string EventId { get; set; } = string.Empty;
        [JsonIgnore]
        public virtual Event? Event { get; set; }

        public string AppUserId { get; set; } = string.Empty;
        [JsonIgnore]
        public virtual AppUser? AppUser { get; set; }

        // Emmagatzemem el moment exacte de la confirmació d'assistència
        public DateTime DataConfirmacio { get; set; } = DateTime.Now;
    }
}