using CollaGegantera.Shared.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CollaGegantera.Api.Data
{
    public static class DbSeeder
    {
        public static async Task SeedRolesAsync(IServiceProvider serviceProvider)
        {
            var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();

            string[] rolsDeLaColla = { 
                "Admin",
                "GeganterBase", 
                "OrganitzadorTrobades", 
                "OrganitzadorAssajos", 
                "Fotograf" 
            };

            foreach (var rol in rolsDeLaColla)
            {
                if (!await roleManager.RoleExistsAsync(rol))
                {
                    await roleManager.CreateAsync(new IdentityRole(rol));
                }
            }

            var configuration = serviceProvider.GetRequiredService<IConfiguration>();
            var adminEmail = configuration["AdminEmail"];
            if (!string.IsNullOrEmpty(adminEmail))
            {
                var userManager = serviceProvider.GetRequiredService<UserManager<AppUser>>();
                var adminUser = await userManager.FindByEmailAsync(adminEmail);
                if (adminUser != null && !await userManager.IsInRoleAsync(adminUser, "Admin"))
                {
                    await userManager.AddToRoleAsync(adminUser, "Admin");
                }
            }

            var context = serviceProvider.GetRequiredService<ApplicationDbContext>();
            if (!await context.CollaSettings.AnyAsync())
            {
                context.CollaSettings.Add(new CollaSettings
                {
                    AvailableRoles = "Cap de colla,Portaestendard,Geganter,Baix de gegant,Capgròs,Macero,Músic,Casteller,Geganta,Altres"
                });
                await context.SaveChangesAsync();
            }
        }
    }
}
