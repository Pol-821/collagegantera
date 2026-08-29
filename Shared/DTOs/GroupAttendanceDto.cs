using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace CollaGegantera.Shared.DTOs
{
    public class GroupAttendanceDto
    {
        [Required(ErrorMessage = "L'ID de l'esdeveniment és obligatori.")]
        public string EventId { get; set; } = string.Empty;

        [Required(ErrorMessage = "Cal especificar almenys un usuari per inscriure.")]
        [MinLength(1, ErrorMessage = "L'array d'usuaris no pot estar buit.")]
        public List<string> UserIds { get; set; } = new List<string>();
    }
}