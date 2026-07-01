using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HindIndisk.Api.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMenuItemIsSignature : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsSignature",
                table: "MenuItems",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsSignature",
                table: "MenuItems");
        }
    }
}
