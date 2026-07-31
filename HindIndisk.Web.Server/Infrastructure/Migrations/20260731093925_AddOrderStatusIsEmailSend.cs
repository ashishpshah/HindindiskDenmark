using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HindIndisk.Api.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderStatusIsEmailSend : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Default true so existing order statuses keep sending customer emails exactly as
            // before this migration — an admin can opt individual statuses out afterward.
            migrationBuilder.AddColumn<bool>(
                name: "IsEmailSend",
                table: "OrderStatuses",
                type: "bit",
                nullable: false,
                defaultValue: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsEmailSend",
                table: "OrderStatuses");
        }
    }
}
