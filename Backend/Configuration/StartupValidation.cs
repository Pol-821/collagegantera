using Microsoft.Extensions.Configuration;

namespace CollaGegantera.Api.Configuration
{
    /// <summary>
    /// Valida que tots els secrets crítics estiguin presents abans que l'aplicació arrenqui.
    /// L'objectiu és fer fallar l'arrencada (fail-fast) si falta un secret, mai fer servir
    /// un valor predeterminat conegut: un fallback convertita un secret en un valor públic.
    /// </summary>
    public static class StartupValidation
    {
        private static readonly string[] ValorsBloquejats =
        {
            "PLACEHOLDER",
            "CHANGE_ME",
            "CHANGE-ME",
            "default-secret",
            "SuperSecretKeyForCollaGegantera2026MustBe32Chars!"
        };

        public static void ValidateRequiredSettings(IConfiguration config)
        {
            var faltants = new List<string>();

            FaltaSi(config["Jwt:Key"], "Jwt:Key", faltants, longitudMinima: 32);
            FaltaSi(config["EmailSettings:SenderPassword"], "EmailSettings:SenderPassword", faltants);
            FaltaSi(config["Vapid:PublicKey"], "Vapid:PublicKey", faltants);
            FaltaSi(config["Vapid:PrivateKey"], "Vapid:PrivateKey", faltants);
            FaltaSi(config["Vapid:Subject"], "Vapid:Subject", faltants);
            FaltaSi(config["CollaCode"], "CollaCode", faltants);
            FaltaSi(config.GetConnectionString("DefaultConnection"), "ConnectionStrings:DefaultConnection", faltants);

            if (faltants.Count > 0)
            {
                throw new InvalidOperationException(
                    "CONFIGURACIÓ CRÍTICA INCOMPLETA: l'aplicació no pot arrencar perquè falten o són invàlids els següents elements: " +
                    string.Join(", ", faltants) +
                    ". Proporciona'ls via variables d'entorn (producció/Docker) o User Secrets (desenvolupament local). " +
                    "No hi ha valors per defecte: això és intencionat per seguretat.");
            }
        }

        private static void FaltaSi(
            string? valor,
            string clau,
            List<string> faltants,
            int longitudMinima = 1)
        {
            if (string.IsNullOrWhiteSpace(valor))
            {
                faltants.Add(clau);
                return;
            }

            if (longitudMinima > 1 && valor.Length < longitudMinima)
            {
                faltants.Add($"{clau} (massa curt: mínim {longitudMinima} caràcters)");
                return;
            }

            bool esPlaceholder = ValorEstàBlockejat(valor);
            if (esPlaceholder)
            {
                faltants.Add($"{clau} (conté un valor de mostra/bloquejat: '{(valor.Length > 24 ? valor[..24] + "..." : valor)}')");
            }
        }

        private static bool ValorEstàBlockejat(string valor)
        {
            foreach (var bloquejat in ValorsBloquejats)
            {
                if (valor.Contains(bloquejat, StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
            }

            return false;
        }
    }
}