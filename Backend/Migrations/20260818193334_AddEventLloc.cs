using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CollaGegantera.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddEventLloc : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Lloc",
                table: "Events",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Lloc",
                table: "Events");
        }
    }
}
