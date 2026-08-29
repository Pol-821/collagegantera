using CollaGegantera.Shared.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace CollaGegantera.Api.Data
{
    public class ApplicationDbContext : IdentityDbContext<AppUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<FamilyGroup> FamilyGroups { get; set; }
        public DbSet<Event> Events { get; set; }
        public DbSet<Dance> Dances { get; set; }
        public DbSet<DanceRole> DanceRoles { get; set; }
        public DbSet<RequiredMaterial> RequiredMaterials { get; set; }
        public DbSet<DanceRoleMaterial> DanceRoleMaterials { get; set; }
        public DbSet<EventUserDanceRole> EventUserDanceRoles { get; set; }
        public DbSet<Attendance> Attendances { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<RecurringPattern> RecurringPatterns { get; set; }
        public DbSet<Survey> Surveys { get; set; }

        public DbSet<Announcement> Announcements { get; set; }
        public DbSet<Photo> Photos { get; set; }
        public DbSet<CollaSettings> CollaSettings { get; set; }
        public DbSet<FamilyMemberRole> FamilyMemberRoles { get; set; }
        public DbSet<EventRegistration> EventRegistrations { get; set; }
        public DbSet<EventStagePosition> EventStagePositions { get; set; }
        public DbSet<PushSubscription> PushSubscriptions { get; set; }
        public DbSet<FamilyInvitation> FamilyInvitations { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<FamilyGroup>().ToTable("FamilyGroups");
            builder.Entity<Event>().ToTable("Events");
            builder.Entity<Dance>().ToTable("Dances");
            builder.Entity<DanceRole>().ToTable("DanceRoles");
            builder.Entity<RequiredMaterial>().ToTable("RequiredMaterials");

            builder.Entity<DanceRoleMaterial>()
                .HasKey(drm => new { drm.DanceRoleId, drm.RequiredMaterialId });
            builder.Entity<DanceRoleMaterial>().ToTable("DanceRoleMaterials");

            builder.Entity<EventUserDanceRole>()
                .HasKey(eudr => new { eudr.EventId, eudr.AppUserId, eudr.DanceRoleId });
            builder.Entity<EventUserDanceRole>().ToTable("EventUserDanceRoles");

            builder.Entity<Attendance>()
                .HasKey(a => new { a.EventId, a.AppUserId });
            builder.Entity<Attendance>().ToTable("Attendances");

            builder.Entity<Notification>().ToTable("Notifications");
            builder.Entity<RecurringPattern>().ToTable("RecurringPatterns");
            builder.Entity<Survey>().ToTable("Surveys");

            builder.Entity<Announcement>().ToTable("Announcements");
            builder.Entity<Photo>().ToTable("Photos");
            builder.Entity<CollaSettings>().ToTable("CollaSettings");
            builder.Entity<FamilyMemberRole>().ToTable("FamilyMemberRoles");

            builder.Entity<FamilyMemberRole>()
                .HasIndex(fmr => new { fmr.FamilyGroupId, fmr.UserId })
                .IsUnique();

            builder.Entity<EventRegistration>().ToTable("EventRegistrations");
            builder.Entity<EventRegistration>()
                .HasIndex(er => new { er.EventId, er.UserId })
                .IsUnique();

            builder.Entity<EventStagePosition>().ToTable("EventStagePositions");
            builder.Entity<EventStagePosition>()
                .HasKey(esp => esp.Id);

            builder.Entity<PushSubscription>().ToTable("PushSubscriptions");
            builder.Entity<PushSubscription>()
                .HasIndex(ps => ps.Endpoint)
                .IsUnique();

            builder.Entity<FamilyInvitation>().ToTable("FamilyInvitations");
        }
    }
}
