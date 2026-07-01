using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HindIndisk.Api.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixBranchOrderTypeFlagsDefault : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE [Branches] SET [DeliveryEnabled] = 1, [PickupEnabled] = 1");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
