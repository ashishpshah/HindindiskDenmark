using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HindIndisk.Api.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOfferDisplayFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Badge",
                table: "Offers",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CtaLink",
                table: "Offers",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CtaText",
                table: "Offers",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "Offers",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsShowOnHome",
                table: "Offers",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Validity",
                table: "Offers",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Badge",
                table: "Offers");

            migrationBuilder.DropColumn(
                name: "CtaLink",
                table: "Offers");

            migrationBuilder.DropColumn(
                name: "CtaText",
                table: "Offers");

            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "Offers");

            migrationBuilder.DropColumn(
                name: "IsShowOnHome",
                table: "Offers");

            migrationBuilder.DropColumn(
                name: "Validity",
                table: "Offers");
        }
    }
}
