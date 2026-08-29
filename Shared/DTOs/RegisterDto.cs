using System;
using System.ComponentModel.DataAnnotations;

namespace CollaGegantera.Shared.DTOs
{
    public class RegisterDto
    {
        [Required(ErrorMessage = "El nom és obligatori.")]
        public string Nom { get; set; } = string.Empty;

        [Required(ErrorMessage = "Els cognoms són obligatoris.")]
        public string Cognoms { get; set; } = string.Empty;

        [Required(ErrorMessage = "L'email és obligatori.")]
        [EmailAddress(ErrorMessage = "El format de l'email no és vàlid.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "La contrasenya és obligatòria.")]
        [MinLength(6, ErrorMessage = "La contrasenya ha de tenir com a mínim 6 caràcters.")]
        public string Password { get; set; } = string.Empty;

        public DateTime DataNaixement { get; set; }

        // Nom opcional per a la família (ex: "Família Mas Garcia")
        public string NomFamilia { get; set; } = string.Empty;

        [Required(ErrorMessage = "El codi de la colla és obligatori.")]
        public string CodiColla { get; set; } = string.Empty;
    }
}