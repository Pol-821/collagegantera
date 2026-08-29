using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CollaGegantera.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddStagePositions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EventStagePositions",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    EventId = table.Column<string>(type: "TEXT", nullable: false),
                    UserId = table.Column<string>(type: "TEXT", nullable: false),
                    DanceName = table.Column<string>(type: "TEXT", nullable: false),
                    X = table.Column<double>(type: "REAL", nullable: false),
                    Y = table.Column<double>(type: "REAL", nullable: false),
                    Notes = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventStagePositions", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EventStagePositions");
        }
    }
}
