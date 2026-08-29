using System;
using System.ComponentModel.DataAnnotations;

namespace CollaGegantera.Shared.DTOs
{
    public class AddFamilyMemberDto
    {
        [Required(ErrorMessage = "El nom és obligatori.")]
        public string Nom { get; set; } = string.Empty;

        [Required(ErrorMessage = "Els cognoms són obligatoris.")]
        public string Cognoms { get; set; } = string.Empty;

        public DateTime DataNaixement { get; set; }
    }
}