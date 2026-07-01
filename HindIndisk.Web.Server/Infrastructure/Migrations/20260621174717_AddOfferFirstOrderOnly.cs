using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HindIndisk.Api.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOfferFirstOrderOnly : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsFirstOrderOnly",
                table: "Offers",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsFirstOrderOnly",
                table: "Offers");
        }
    }
}
