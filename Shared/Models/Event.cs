using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema; // NOU: Per utilitzar [NotMapped]
using System.Globalization; // NOU: Per formatar els decimals correctament
using CollaGegantera.Shared.Enums;

namespace CollaGegantera.Shared.Models
{
    public class Event
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();

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

        public string? RecurringPatternId { get; set; }

        // === NOU: GENERACIÓ DINÀMICA DE L'URL DE GOOGLE MAPS ===
        // L'atribut [NotMapped] indica a Entity Framework que NO ha de buscar 
        // ni crear cap columna a la base de dades SQLite per aquesta propietat.
        // Es calcula en temps d'execució (RAM).
        [NotMapped]
        public string GoogleMapsUrl => 
            $"https://maps.google.com/?q={Latitud.ToString(CultureInfo.InvariantCulture)},{Longitud.ToString(CultureInfo.InvariantCulture)}";
    }
}