using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HindIndisk.Api.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBranchPricingConfig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "DeliveryFee",
                table: "Branches",
                type: "decimal(8,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "DeliveryFeeEnabled",
                table: "Branches",
                type: "bit",
                nullable: false,
                defaultValue: false);

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeliveryFee",
                table: "Branches");

            migrationBuilder.DropColumn(
                name: "DeliveryFeeEnabled",
                table: "Branches");

            migrationBuilder.DropColumn(
                name: "TaxEnabled",
                table: "Branches");

            migrationBuilder.DropColumn(
                name: "TaxPercentage",
                table: "Branches");
        }
    }
}
