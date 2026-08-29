using System.ComponentModel.DataAnnotations;

namespace CollaGegantera.Shared.DTOs
{
    public class LoginDto
    {
        [Required(ErrorMessage = "L'email és obligatori.")]
        [EmailAddress(ErrorMessage = "El format de l'email no és vàlid.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "La contrasenya és obligatòria.")]
        public string Password { get; set; } = string.Empty;
    }
}