using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CollaGegantera.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddFamilyMemberExtraFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Cognoms",
                table: "FamilyMemberRoles",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "FamilyMemberRoles",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Nom",
                table: "FamilyMemberRoles",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Cognoms",
                table: "FamilyMemberRoles");

            migrationBuilder.DropColumn(
                name: "Email",
                table: "FamilyMemberRoles");

            migrationBuilder.DropColumn(
                name: "Nom",
                table: "FamilyMemberRoles");
        }
    }
}
