using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CollaGegantera.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddImprovementsTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "RecurringPatternId",
                table: "Events",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AvatarUrl",
                table: "AspNetUsers",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    UserId = table.Column<string>(type: "TEXT", nullable: false),
                    Title = table.Column<string>(type: "TEXT", nullable: false),
                    Body = table.Column<string>(type: "TEXT", nullable: false),
                    Type = table.Column<string>(type: "TEXT", nullable: false),
                    RelatedEventId = table.Column<string>(type: "TEXT", nullable: true),
                    IsRead = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Notifications_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Notifications_Events_RelatedEventId",
                        column: x => x.RelatedEventId,
                        principalTable: "Events",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "RecurringPatterns",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    DayOfWeek = table.Column<int>(type: "INTEGER", nullable: false),
                    IntervalWeeks = table.Column<int>(type: "INTEGER", nullable: false),
                    TotalOccurrences = table.Column<int>(type: "INTEGER", nullable: false),
                    StartDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    EndDate = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecurringPatterns", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Surveys",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    Title = table.Column<string>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: false),
                    OptionsJson = table.Column<string>(type: "TEXT", nullable: false),
                    VotesJson = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "TEXT", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Surveys", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Events_RecurringPatternId",
                table: "Events",
                column: "RecurringPatternId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_RelatedEventId",
                table: "Notifications",
                column: "RelatedEventId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_UserId",
                table: "Notifications",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Events_RecurringPatterns_RecurringPatternId",
                table: "Events",
                column: "RecurringPatternId",
                principalTable: "RecurringPatterns",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Events_RecurringPatterns_RecurringPatternId",
                table: "Events");

            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropTable(
                name: "RecurringPatterns");

            migrationBuilder.DropTable(
                name: "Surveys");

            migrationBuilder.DropIndex(
                name: "IX_Events_RecurringPatternId",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "RecurringPatternId",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "AvatarUrl",
                table: "AspNetUsers");
        }
    }
}
