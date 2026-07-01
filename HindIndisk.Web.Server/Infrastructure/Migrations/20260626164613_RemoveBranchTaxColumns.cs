using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HindIndisk.Api.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveBranchTaxColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TaxEnabled",
                table: "Branches");

            migrationBuilder.DropColumn(
                name: "TaxPercentage",
                table: "Branches");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "TaxEnabled",
                table: "Branches",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "TaxPercentage",
                table: "Branches",
                type: "decimal(5,2)",
                nullable: false,
                defaultValue: 0m);
        }
    }
}
