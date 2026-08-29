using Microsoft.Extensions.Configuration;

namespace CollaGegantera.Api.Configuration
{
    /// <summary>
    /// Accepta variables d'entorn amb noms "genèrics" (JWT_KEY, SMTP_PASSWORD, VAPID_PRIVATE_KEY,
    /// DATABASE_CONNECTION, ...) a més del patró nadiu d'ASP.NET Core (Jwt__Key, ...).
    /// Només aplica un valor si existeix; si no, es conserva el que hi hagi a la configuració.
    /// </summary>
    public static class SecretEnvironment
    {
        public static void Apply(IConfigurationManager config)
        {
            AplicarSiExisteix(config, "JWT_KEY", "Jwt:Key");
            AplicarSiExisteix(config, "COLLA_CODE", "CollaCode");
            AplicarSiExisteix(config, "ADMIN_EMAIL", "AdminEmail");
            AplicarSiExisteix(config, "DATABASE_CONNECTION", "ConnectionStrings:DefaultConnection");

            AplicarSiExisteix(config, "SMTP_HOST", "EmailSettings:SmtpServer");
            AplicarSiExisteix(config, "SMTP_PORT", "EmailSettings:SmtpPort");
            AplicarSiExisteix(config, "SMTP_USERNAME", "EmailSettings:SenderEmail");
            AplicarSiExisteix(config, "SMTP_SENDER_NAME", "EmailSettings:SenderName");
            AplicarSiExisteix(config, "SMTP_PASSWORD", "EmailSettings:SenderPassword");

            AplicarSiExisteix(config, "VAPID_PUBLIC_KEY", "Vapid:PublicKey");
            AplicarSiExisteix(config, "VAPID_PRIVATE_KEY", "Vapid:PrivateKey");
            AplicarSiExisteix(config, "VAPID_SUBJECT", "Vapid:Subject");
        }

        private static void AplicarSiExisteix(IConfigurationManager config, string variableEntorn, string clauConfig)
        {
            var valor = Environment.GetEnvironmentVariable(variableEntorn);
            if (!string.IsNullOrWhiteSpace(valor))
            {
                config[clauConfig] = valor;
            }
        }
    }
}