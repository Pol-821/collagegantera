using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;

namespace CollaGegantera.Api.Services
{
    public class EmailService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration config, ILogger<EmailService> logger)
        {
            _config = config;
            _logger = logger;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string bodyHtml)
        {
            try
            {
                var smtpServer = _config["EmailSettings:SmtpServer"];
                var smtpPort = int.Parse(_config["EmailSettings:SmtpPort"]!);
                var senderEmail = _config["EmailSettings:SenderEmail"];
                var senderPassword = _config["EmailSettings:SenderPassword"];
                var senderName = _config["EmailSettings:SenderName"];

                using var client = new SmtpClient(smtpServer, smtpPort)
                {
                    Credentials = new NetworkCredential(senderEmail, senderPassword),
                    EnableSsl = true // Exigència de seguretat obligatòria per a Gmail
                };

                using var mailMessage = new MailMessage
                {
                    From = new MailAddress(senderEmail!, senderName),
                    Subject = subject,
                    Body = bodyHtml,
                    IsBodyHtml = true
                };
                
                mailMessage.To.Add(toEmail);

                await client.SendMailAsync(mailMessage);
                _logger.LogInformation($"Correu electrònic enviat correctament a: {toEmail}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"S'ha produït un error crític intentant enviar un correu a {toEmail}");
            }
        }
    }
}