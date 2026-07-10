using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HindIndisk.Web.Server.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveReservationClosureFromBranch : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeliveryEnabled",
                table: "Branches");

            migrationBuilder.DropColumn(
                name: "IsCloseReservation",
                table: "Branches");

            migrationBuilder.DropColumn(
                name: "PickupEnabled",
                table: "Branches");

            migrationBuilder.RenameColumn(
                name: "CloseReservationNote",
                table: "Branches",
                newName: "CloseOrderNoteDa");

            migrationBuilder.AddColumn<string>(
                name: "NoteDa",
                table: "BranchServiceClosures",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsOpen",
                table: "BranchDaySchedules",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "OffMessage",
                table: "BranchDaySchedules",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OffMessageDa",
                table: "BranchDaySchedules",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DisplayBeforeDays",
                table: "BranchClosures",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "NoteDa",
                table: "BranchClosures",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NoteDa",
                table: "BranchServiceClosures");

            migrationBuilder.DropColumn(
                name: "IsOpen",
                table: "BranchDaySchedules");

            migrationBuilder.DropColumn(
                name: "OffMessage",
                table: "BranchDaySchedules");

            migrationBuilder.DropColumn(
                name: "OffMessageDa",
                table: "BranchDaySchedules");

            migrationBuilder.DropColumn(
                name: "DisplayBeforeDays",
                table: "BranchClosures");

            migrationBuilder.DropColumn(
                name: "NoteDa",
                table: "BranchClosures");

            migrationBuilder.RenameColumn(
                name: "CloseOrderNoteDa",
                table: "Branches",
                newName: "CloseReservationNote");

            migrationBuilder.AddColumn<bool>(
                name: "DeliveryEnabled",
                table: "Branches",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsCloseReservation",
                table: "Branches",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "PickupEnabled",
                table: "Branches",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }
    }
}
