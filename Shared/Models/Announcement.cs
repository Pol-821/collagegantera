using System;
using System.ComponentModel.DataAnnotations;

namespace CollaGegantera.Shared.Models
{
    public class Announcement
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        
        [Required]
        public string Title { get; set; } = string.Empty;
        
        [Required]
        public string Body { get; set; } = string.Empty;
        
        [Required]
        public string AuthorId { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public bool IsPinned { get; set; }
        
        public string? ImageUrl { get; set; }
    }
}
