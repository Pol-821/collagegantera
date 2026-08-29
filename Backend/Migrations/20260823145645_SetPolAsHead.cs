using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CollaGegantera.Api.Migrations
{
    /// <inheritdoc />
    public partial class SetPolAsHead : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                UPDATE AspNetUsers
                SET IsFamilyHead = 1,
                    EncryptedFamilyRole = NULL
                WHERE Id = 'f7efdadc-b2ed-4ec2-bc94-19b035dc85ee'
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
