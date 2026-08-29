using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace CollaGegantera.Shared.Models
{
    public class Survey
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        [JsonIgnore]
        public string OptionsJson { get; set; } = "[]";

        [JsonIgnore]
        public string VotesJson { get; set; } = "{}";

        public string CreatedByUserId { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime? ExpiresAt { get; set; }

        public List<string> GetOptions()
        {
            return System.Text.Json.JsonSerializer.Deserialize<List<string>>(OptionsJson) ?? new List<string>();
        }

        public void SetOptions(List<string> options)
        {
            OptionsJson = System.Text.Json.JsonSerializer.Serialize(options);
        }

        public Dictionary<string, List<string>> GetVotes()
        {
            return System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, List<string>>>(VotesJson) ?? new Dictionary<string, List<string>>();
        }

        public void SetVotes(Dictionary<string, List<string>> votes)
        {
            VotesJson = System.Text.Json.JsonSerializer.Serialize(votes);
        }
    }
}
