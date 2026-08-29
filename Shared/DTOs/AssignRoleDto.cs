using System.ComponentModel.DataAnnotations;

namespace CollaGegantera.Shared.DTOs
{
    public class AssignRoleDto
    {
        [Required]
        public string EventId { get; set; } = string.Empty;
        
        [Required]
        public string AppUserId { get; set; } = string.Empty;
        
        [Required]
        public string DanceRoleId { get; set; } = string.Empty;
    }
}