using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CollaGegantera.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddNotificationsEnabled : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "NotificationsEnabled",
                table: "AspNetUsers",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            // Existing users should have notifications enabled by default
            migrationBuilder.Sql("UPDATE AspNetUsers SET NotificationsEnabled = 1");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NotificationsEnabled",
                table: "AspNetUsers");
        }
    }
}
