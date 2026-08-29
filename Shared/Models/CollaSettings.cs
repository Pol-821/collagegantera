using System.ComponentModel.DataAnnotations;

namespace CollaGegantera.Shared.Models
{
    public class CollaSettings
    {
        public int Id { get; set; } = 1;
        
        public string CollaName { get; set; } = "Colla Gegantera";
        
        public string PrimaryColor { get; set; } = "#e63946";
        
        public string? LogoUrl { get; set; }

        public string AvailableRoles { get; set; } = "Cap de colla,Portaestendard,Geganter,Baix de gegant,Capgròs,Macero,Músic,Casteller,Geganta,Altres";

        public string? AvailableRoleGroups { get; set; } = "{\"Geganter\":[\"1r portador\",\"2n portador\",\"3r portador\",\"Baix de gegant\"],\"Portaestendard\":[],\"Capgròs\":[],\"Músic\":[\"Tible\",\"Tenora\",\"Gralles\",\"Baix\",\"Contrabaix\"],\"Macero\":[],\"Casteller\":[],\"Cap de colla\":[],\"Geganta\":[],\"Altres\":[]}";
    }
}
