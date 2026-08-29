using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CollaGegantera.Api.Migrations
{
    /// <inheritdoc />
    public partial class CleanupOrphanedMembers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Delete non-account members whose FamilyGroupId no longer exists
            migrationBuilder.Sql(@"
                DELETE FROM FamilyMemberRoles
                WHERE HasAccount = 0
                  AND FamilyGroupId NOT IN (SELECT Id FROM FamilyGroups)
            ");
            // Delete non-account members in families with no account users left
            migrationBuilder.Sql(@"
                DELETE FROM FamilyMemberRoles
                WHERE HasAccount = 0
                  AND FamilyGroupId IN (
                    SELECT fg.Id FROM FamilyGroups fg
                    WHERE NOT EXISTS (
                      SELECT 1 FROM AspNetUsers u WHERE u.FamilyGroupId = fg.Id
                    )
                  )
            ");
            // Delete orphaned FamilyGroups (no account users, no non-account members)
            migrationBuilder.Sql(@"
                DELETE FROM FamilyGroups
                WHERE Id NOT IN (SELECT DISTINCT FamilyGroupId FROM AspNetUsers WHERE FamilyGroupId IS NOT NULL)
                  AND Id NOT IN (SELECT DISTINCT FamilyGroupId FROM FamilyMemberRoles WHERE FamilyGroupId IS NOT NULL)
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
