using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CollaGegantera.Api.Migrations
{
    /// <inheritdoc />
    public partial class FixOrphanedFamilyMembers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Fix users who have a FamilyMemberRole entry (HasAccount=1) but their
            // FamilyGroupId in AspNetUsers was never updated (old AddMember bug).
            migrationBuilder.Sql(@"
                UPDATE AspNetUsers
                SET FamilyGroupId = (
                    SELECT fm.FamilyGroupId
                    FROM FamilyMemberRoles fm
                    WHERE fm.UserId = AspNetUsers.Id
                      AND fm.HasAccount = 1
                    LIMIT 1
                )
                WHERE EXISTS (
                    SELECT 1
                    FROM FamilyMemberRoles fm
                    WHERE fm.UserId = AspNetUsers.Id
                      AND fm.HasAccount = 1
                      AND (fm.FamilyGroupId != AspNetUsers.FamilyGroupId
                           OR AspNetUsers.FamilyGroupId IS NULL
                           OR AspNetUsers.FamilyGroupId = '')
                )
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
