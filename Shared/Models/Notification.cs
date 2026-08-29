using System;
using System.Text.Json.Serialization;

namespace CollaGegantera.Shared.Models
{
    public class Notification
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string UserId { get; set; } = string.Empty;
        [JsonIgnore]
        public virtual AppUser? User { get; set; }

        [System.ComponentModel.DataAnnotations.Required]
        public string Title { get; set; } = string.Empty;

        public string Body { get; set; } = string.Empty;

        public string Type { get; set; } = "General";

        public string? RelatedEventId { get; set; }
        [JsonIgnore]
        public virtual Event? RelatedEvent { get; set; }

        public bool IsRead { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
