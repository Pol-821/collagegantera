using CollaGegantera.Api.Data;
using CollaGegantera.Shared.Enums;
using CollaGegantera.Shared.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace CollaGegantera.Api.Services
{
    public class DailyReminderWorker : BackgroundService
    {
        private readonly ILogger<DailyReminderWorker> _logger;
        private readonly IServiceProvider _serviceProvider;

        public DailyReminderWorker(ILogger<DailyReminderWorker> logger, IServiceProvider serviceProvider)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Job Scheduler Natiu iniciat. Preparant l'automatització de notificacions...");

            while (!stoppingToken.IsCancellationRequested)
            {
                var ara = DateTime.Now;
                var proximaExecucio = new DateTime(ara.Year, ara.Month, ara.Day, 1, 0, 0);

                if (ara > proximaExecucio)
                {
                    proximaExecucio = proximaExecucio.AddDays(1);
                }

                var tempsEspera = proximaExecucio - ara;
                _logger.LogInformation($"Proper Cron Job d'alertes programat per d'aquí a {tempsEspera.TotalHours:F2} hores.");

                await Task.Delay(tempsEspera, stoppingToken);

                _logger.LogInformation("Iniciant el despatx de notificacions de matinada...");

                try
                {
                    using (var scope = _serviceProvider.CreateScope())
                    {
                        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                        var emailService = scope.ServiceProvider.GetRequiredService<EmailService>();
                        var notificationService = scope.ServiceProvider.GetRequiredService<NotificationService>();

                        var usuarisContactables = await context.Users
                            .Where(u => u.Email != null && !u.Email.EndsWith("@familiar.local"))
                            .Select(u => new { u.Id, u.Nom, u.Email })
                            .ToListAsync(stoppingToken);

                        // Regles de recordatori:
                        // Trobades: 30 dies i 15 dies abans
                        // Assajos: 7 dies abans
                        var regles = new Dictionary<TipusEvent, int[]>
                        {
                            { TipusEvent.Trobada, new[] { 30, 15 } },
                            { TipusEvent.Assaig, new[] { 7 } }
                        };

                        foreach (var regla in regles)
                        {
                            var tipus = regla.Key;
                            var diesAbans = regla.Value;

                            foreach (var dies in diesAbans)
                            {
                                var dataObjectiu = DateTime.Today.AddDays(dies);

                                var esdeveniments = await context.Events
                                    .Where(e => e.Tipus == tipus && e.DataHora.Date == dataObjectiu)
                                    .ToListAsync(stoppingToken);

                                if (!esdeveniments.Any()) continue;

                                var nomTipus = tipus == TipusEvent.Trobada ? "trobada" : "assaig";

                                foreach (var ev in esdeveniments)
                                {
                                    var inscritsIds = await context.Attendances
                                        .Where(a => a.EventId == ev.Id)
                                        .Select(a => a.AppUserId)
                                        .ToListAsync(stoppingToken);

                                    // Notificació in-app a tots els usuaris
                                    var titol = $"Recordatori: {nomTipus} d'aquí a {dies} dies";
                                    var cos = $"L'{nomTipus} \"{ev.Nom}\" serà el dia {ev.DataHora:dd/MM/yyyy}. No t'ho perdis!";
                                    await notificationService.SendToAllAsync(titol, cos, ev.Id);

                                    // Correu electrònic
                                    foreach (var usuari in usuarisContactables)
                                    {
                                        bool estaInscrit = inscritsIds.Contains(usuari.Id);

                                        string assumpte = estaInscrit
                                            ? $"[Recordatori] Falten {dies} dies per: {ev.Nom}"
                                            : $"[Acció Requerida] T'esperem a: {ev.Nom}";

                                        string cosCorreu = estaInscrit
                                            ? $"Hola {usuari.Nom},<br><br>Et recordem que d'aquí a {dies} dies tenim l'{nomTipus} <b>{ev.Nom}</b> ({ev.DataHora:dd/MM/yyyy}).<br>Ja constes com a inscrit/a. Gràcies per la teva implicació!<br><br>Equip de la Colla Gegantera"
                                            : $"Hola {usuari.Nom},<br><br>D'aquí a {dies} dies tenim l'{nomTipus} <b>{ev.Nom}</b> ({ev.DataHora:dd/MM/yyyy}).<br>Hem vist que encara <b>NO</b> t'has inscrit. Si us plau, entra a l'App i confirma la teva assistència.<br><br>Equip de la Colla Gegantera";

                                        await emailService.SendEmailAsync(usuari.Email!, assumpte, cosCorreu);
                                        await Task.Delay(500, stoppingToken);
                                    }

                                    _logger.LogInformation($"Recordatori enviat per \"{ev.Nom}\" ({dies} dies, {nomTipus}).");
                                }
                            }
                        }

                        _logger.LogInformation("Despatx de notificacions finalitzat amb èxit.");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error crític en l'automatització de notificacions.");
                }
            }
        }
    }
}
