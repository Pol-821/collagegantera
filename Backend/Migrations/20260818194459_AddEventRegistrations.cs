using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CollaGegantera.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddEventRegistrations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EventRegistrations",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    EventId = table.Column<string>(type: "TEXT", nullable: false),
                    UserId = table.Column<string>(type: "TEXT", nullable: false),
                    RegisteredAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventRegistrations", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EventRegistrations_EventId_UserId",
                table: "EventRegistrations",
                columns: new[] { "EventId", "UserId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EventRegistrations");
        }
    }
}
