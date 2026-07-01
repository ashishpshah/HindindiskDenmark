using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HindIndisk.Web.Server.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderPlacedByUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "PlacedByUserId",
                table: "Orders",
                type: "bigint",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Orders_PlacedByUserId",
                table: "Orders",
                column: "PlacedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_Users_PlacedByUserId",
                table: "Orders",
                column: "PlacedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Orders_Users_PlacedByUserId",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_PlacedByUserId",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "PlacedByUserId",
                table: "Orders");
        }
    }
}
