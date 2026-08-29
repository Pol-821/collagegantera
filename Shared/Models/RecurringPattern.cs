using System;
using System.Text.Json.Serialization;

namespace CollaGegantera.Shared.Models
{
    public class RecurringPattern
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public int DayOfWeek { get; set; }

        public int IntervalWeeks { get; set; } = 1;

        public int TotalOccurrences { get; set; } = 10;

        public DateTime StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        [JsonIgnore]
        public virtual Event? Event { get; set; }
    }
}
