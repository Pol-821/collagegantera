using System.Collections.Generic;

namespace CollaGegantera.Shared.DTOs
{
    public class MaterialEspecificDto
    {
        public string Nom { get; set; } = string.Empty;
        public int Quantitat { get; set; }
    }

    public class MyEventMaterialDto
    {
        public string MaterialGeneralEsdeveniment { get; set; } = string.Empty;
        public List<MaterialEspecificDto> MaterialEspecificRol { get; set; } = new List<MaterialEspecificDto>();
    }
}