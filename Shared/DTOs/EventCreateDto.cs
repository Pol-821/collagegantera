using System;
using System.ComponentModel.DataAnnotations;
using CollaGegantera.Shared.Enums;

namespace CollaGegantera.Shared.DTOs
{
    public class EventCreateDto
    {
        [Required(ErrorMessage = "El nom de l'esdeveniment és obligatori.")]
        public string Nom { get; set; } = string.Empty;

        [Required(ErrorMessage = "La data i hora són obligatòries.")]
        public DateTime DataHora { get; set; }

        public string Descripcio { get; set; } = string.Empty;

        public string Lloc { get; set; } = string.Empty;

        public double Latitud { get; set; }
        public double Longitud { get; set; }

        public string MaterialImprescindible { get; set; } = string.Empty;

        public string Normes { get; set; } = string.Empty;
        
        [Required]
        public TipusEvent Tipus { get; set; }

        public RecurringDto? Recurring { get; set; }
    }

    public class RecurringDto
    {
        public int DayOfWeek { get; set; }
        public int IntervalWeeks { get; set; } = 1;
        public int TotalOccurrences { get; set; } = 1;
        public DateTime? EndDate { get; set; }
    }
}