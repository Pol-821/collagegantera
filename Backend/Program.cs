using CollaGegantera.Api.Data;
using CollaGegantera.Shared.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer; // NOU: Espai de noms per JWT
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens; // NOU: Per la clau de seguretat
using Microsoft.OpenApi.Models;
using System.Text; // NOU: Per decodificar la clau JWT

var builder = WebApplication.CreateBuilder(args);

// Secrets des de variables d'entorn genèriques (JWT_KEY, SMTP_PASSWORD, VAPID_PRIVATE_KEY, ...)
// i sota el patró ASP.NET amb doble guió baix (Jwt__Key, EmailSettings__SenderPassword, ...)
CollaGegantera.Api.Configuration.SecretEnvironment.Apply(builder.Configuration);

// Validació en arrencar: si falta un secret crític, l'aplicació no arrenca (sense fallbacks).
CollaGegantera.Api.Configuration.StartupValidation.ValidateRequiredSettings(builder.Configuration);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// === CONFIGURACIÓ SWAGGER AMB SUPORT PER A JWT ===
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "API Colla Gegantera", Version = "v1" });

    // Botó per introduir el Token al Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Autorització JWT. Escriu 'Bearer' [espai] i el teu token.\nExemple: 'Bearer eyJhbGci...'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            new string[] {}
        }
    });
});

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddIdentity<AppUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 6;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireLowercase = false;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// === NOVA CONFIGURACIÓ: AUTENTICACIÓ JWT ===
var jwtSettings = builder.Configuration.GetSection("Jwt");
var key = Encoding.ASCII.GetBytes(jwtSettings["Key"]!);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false; // Ho deixem en false pel desenvolupament local
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidateAudience = true,
        ValidAudience = jwtSettings["Audience"],
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero // Elimina el marge de 5 minuts per defecte de caducitat
    };
});

builder.Services.AddTransient<CollaGegantera.Api.Services.EmailService>();
builder.Services.AddTransient<CollaGegantera.Api.Services.PushNotificationService>();
builder.Services.AddTransient<CollaGegantera.Api.Services.NotificationService>();
builder.Services.AddSingleton<CollaGegantera.Api.Services.GoogleDriveService>();
builder.Services.AddHostedService<CollaGegantera.Api.Services.DailyReminderWorker>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowPWA", policy =>
    {
        policy.WithOrigins("https://colla-gegantera.pages.dev")
              .AllowAnyMethod()
              .AllowAnyHeader();

        if (builder.Environment.IsDevelopment())
        {
            policy.SetIsOriginAllowed(origin =>
                origin.StartsWith("http://localhost") ||
                origin.StartsWith("https://localhost"))
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        }
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "API Colla Gegantera v1"));
}

app.UseHttpsRedirection();

app.UseStaticFiles();

app.UseCors("AllowPWA");

// === MIDDLEWARES DE SEGURETAT (L'ordre és obligatori) ===
app.UseAuthentication(); // 1r: Qui ets? (Desxifra el JWT)
app.UseAuthorization();  // 2n: Què pots fer? (Comprova els Rols)

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        // Cridem al mètode asíncron per crear els rols
        await DbSeeder.SeedRolesAsync(services);
    }
    catch (Exception ex)
    {
        // Si hi ha un problema de connexió amb SQLite, ho registrarem per consola
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "S'ha produït un error durant el seeding dels rols a la base de dades.");
    }
}

app.Run();