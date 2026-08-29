using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CollaGegantera.Api.Migrations
{
    /// <inheritdoc />
    public partial class FixIsFamilyHead : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Fix IsFamilyHead: only the user who owns the FamilyGroup should be head
            migrationBuilder.Sql(@"
                UPDATE AspNetUsers
                SET IsFamilyHead = CASE
                    WHEN EXISTS (
                        SELECT 1 FROM FamilyGroups fg
                        WHERE fg.Id = AspNetUsers.FamilyGroupId
                          AND fg.ParentUserId = AspNetUsers.Id
                    ) THEN 1
                    ELSE 0
                END
            ");
            // Clear EncryptedFamilyRole for family heads (heads should not have a role)
            migrationBuilder.Sql(@"
                UPDATE AspNetUsers
                SET EncryptedFamilyRole = NULL
                WHERE IsFamilyHead = 1
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
