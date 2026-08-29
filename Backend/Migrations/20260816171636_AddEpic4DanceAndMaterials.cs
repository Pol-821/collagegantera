using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CollaGegantera.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddEpic4DanceAndMaterials : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Dances",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    Nom = table.Column<string>(type: "TEXT", nullable: false),
                    Descripcio = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Dances", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RequiredMaterials",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    Nom = table.Column<string>(type: "TEXT", nullable: false),
                    Descripcio = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RequiredMaterials", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DanceRoles",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    Nom = table.Column<string>(type: "TEXT", nullable: false),
                    DanceId = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DanceRoles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DanceRoles_Dances_DanceId",
                        column: x => x.DanceId,
                        principalTable: "Dances",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DanceRoleMaterials",
                columns: table => new
                {
                    DanceRoleId = table.Column<string>(type: "TEXT", nullable: false),
                    RequiredMaterialId = table.Column<string>(type: "TEXT", nullable: false),
                    Quantitat = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DanceRoleMaterials", x => new { x.DanceRoleId, x.RequiredMaterialId });
                    table.ForeignKey(
                        name: "FK_DanceRoleMaterials_DanceRoles_DanceRoleId",
                        column: x => x.DanceRoleId,
                        principalTable: "DanceRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DanceRoleMaterials_RequiredMaterials_RequiredMaterialId",
                        column: x => x.RequiredMaterialId,
                        principalTable: "RequiredMaterials",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EventUserDanceRoles",
                columns: table => new
                {
                    EventId = table.Column<string>(type: "TEXT", nullable: false),
                    AppUserId = table.Column<string>(type: "TEXT", nullable: false),
                    DanceRoleId = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventUserDanceRoles", x => new { x.EventId, x.AppUserId, x.DanceRoleId });
                    table.ForeignKey(
                        name: "FK_EventUserDanceRoles_AspNetUsers_AppUserId",
                        column: x => x.AppUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EventUserDanceRoles_DanceRoles_DanceRoleId",
                        column: x => x.DanceRoleId,
                        principalTable: "DanceRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EventUserDanceRoles_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DanceRoleMaterials_RequiredMaterialId",
                table: "DanceRoleMaterials",
                column: "RequiredMaterialId");

            migrationBuilder.CreateIndex(
                name: "IX_DanceRoles_DanceId",
                table: "DanceRoles",
                column: "DanceId");

            migrationBuilder.CreateIndex(
                name: "IX_EventUserDanceRoles_AppUserId",
                table: "EventUserDanceRoles",
                column: "AppUserId");

            migrationBuilder.CreateIndex(
                name: "IX_EventUserDanceRoles_DanceRoleId",
                table: "EventUserDanceRoles",
                column: "DanceRoleId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DanceRoleMaterials");

            migrationBuilder.DropTable(
                name: "EventUserDanceRoles");

            migrationBuilder.DropTable(
                name: "RequiredMaterials");

            migrationBuilder.DropTable(
                name: "DanceRoles");

            migrationBuilder.DropTable(
                name: "Dances");
        }
    }
}
