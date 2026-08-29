using System;
using System.ComponentModel.DataAnnotations;

namespace CollaGegantera.Shared.Models
{
    public class Photo
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        
        [Required]
        public string EventId { get; set; } = string.Empty;
        
        [Required]
        public string Url { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        public string? UploadedById { get; set; }
        
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
        
        public int Year { get; set; }
    }
}
