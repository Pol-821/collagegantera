using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace CollaGegantera.Shared.Models
{
    public class Dance
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required(ErrorMessage = "El nom del ball és obligatori.")]
        public string Nom { get; set; } = string.Empty;

        public string Descripcio { get; set; } = string.Empty;

        // Relació 1:N amb els rols (Tasca 4.1)
        [JsonIgnore]
        public ICollection<DanceRole> Rols { get; set; } = new List<DanceRole>();
    }
}