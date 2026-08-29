using System.ComponentModel.DataAnnotations;

namespace CollaGegantera.Shared.Models
{
    public class EventRegistration
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string EventId { get; set; } = string.Empty;

        [Required]
        public string UserId { get; set; } = string.Empty;

        public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;

        public string? AssignedRole { get; set; }
    }
}
