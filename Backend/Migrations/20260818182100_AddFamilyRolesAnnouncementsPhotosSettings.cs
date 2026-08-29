using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CollaGegantera.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddFamilyRolesAnnouncementsPhotosSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ParentUserId",
                table: "FamilyGroups",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EncryptedFamilyRole",
                table: "AspNetUsers",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsFamilyHead",
                table: "AspNetUsers",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "Announcements",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    Title = table.Column<string>(type: "TEXT", nullable: false),
                    Body = table.Column<string>(type: "TEXT", nullable: false),
                    AuthorId = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    IsPinned = table.Column<bool>(type: "INTEGER", nullable: false),
                    ImageUrl = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Announcements", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CollaSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    CollaName = table.Column<string>(type: "TEXT", nullable: false),
                    PrimaryColor = table.Column<string>(type: "TEXT", nullable: false),
                    LogoUrl = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CollaSettings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FamilyMemberRoles",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    FamilyGroupId = table.Column<string>(type: "TEXT", nullable: false),
                    UserId = table.Column<string>(type: "TEXT", nullable: false),
                    Role = table.Column<string>(type: "TEXT", nullable: false),
                    HasAccount = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FamilyMemberRoles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Photos",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    EventId = table.Column<string>(type: "TEXT", nullable: false),
                    Url = table.Column<string>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: true),
                    UploadedById = table.Column<string>(type: "TEXT", nullable: true),
                    UploadedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Year = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Photos", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FamilyMemberRoles_FamilyGroupId_UserId",
                table: "FamilyMemberRoles",
                columns: new[] { "FamilyGroupId", "UserId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Announcements");

            migrationBuilder.DropTable(
                name: "CollaSettings");

            migrationBuilder.DropTable(
                name: "FamilyMemberRoles");

            migrationBuilder.DropTable(
                name: "Photos");

            migrationBuilder.DropColumn(
                name: "ParentUserId",
                table: "FamilyGroups");

            migrationBuilder.DropColumn(
                name: "EncryptedFamilyRole",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "IsFamilyHead",
                table: "AspNetUsers");
        }
    }
}
