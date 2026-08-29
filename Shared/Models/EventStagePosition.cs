using System.ComponentModel.DataAnnotations;

namespace CollaGegantera.Shared.Models
{
    public class EventStagePosition
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string EventId { get; set; } = string.Empty;

        [Required]
        public string UserId { get; set; } = string.Empty;

        public string DanceName { get; set; } = string.Empty;

        public double X { get; set; }

        public double Y { get; set; }

        public string? Notes { get; set; }
    }
}
