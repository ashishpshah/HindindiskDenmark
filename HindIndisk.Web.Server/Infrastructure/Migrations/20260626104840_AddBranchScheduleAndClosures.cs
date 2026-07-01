using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HindIndisk.Api.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBranchScheduleAndClosures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "WeekdayCloseTime",
                table: "Branches");

            migrationBuilder.DropColumn(
                name: "WeekdayOpenTime",
                table: "Branches");

            migrationBuilder.DropColumn(
                name: "WeekendCloseTime",
                table: "Branches");

            migrationBuilder.DropColumn(
                name: "WeekendOpenTime",
                table: "Branches");

            migrationBuilder.CreateTable(
                name: "BranchClosurePeriods",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BranchId = table.Column<long>(type: "bigint", nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    StartTime = table.Column<TimeOnly>(type: "time", nullable: true),
                    EndTime = table.Column<TimeOnly>(type: "time", nullable: true),
                    Reason = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BranchClosurePeriods", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BranchClosurePeriods_Branches_BranchId",
                        column: x => x.BranchId,
                        principalTable: "Branches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BranchDaySchedules",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BranchId = table.Column<long>(type: "bigint", nullable: false),
                    DayOfWeek = table.Column<int>(type: "int", nullable: false),
                    OpenTime = table.Column<TimeOnly>(type: "time", nullable: false),
                    CloseTime = table.Column<TimeOnly>(type: "time", nullable: false),
                    SlotIntervalMinutes = table.Column<int>(type: "int", nullable: false),
                    MaxOrdersPerSlot = table.Column<int>(type: "int", nullable: false),
                    MaxReservationsPerSlot = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BranchDaySchedules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BranchDaySchedules_Branches_BranchId",
                        column: x => x.BranchId,
                        principalTable: "Branches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BranchClosurePeriods_BranchId",
                table: "BranchClosurePeriods",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_BranchDaySchedules_BranchId_DayOfWeek",
                table: "BranchDaySchedules",
                columns: new[] { "BranchId", "DayOfWeek" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BranchClosurePeriods");

            migrationBuilder.DropTable(
                name: "BranchDaySchedules");

            migrationBuilder.AddColumn<TimeOnly>(
                name: "WeekdayCloseTime",
                table: "Branches",
                type: "time",
                nullable: false,
                defaultValue: new TimeOnly(0, 0, 0));

            migrationBuilder.AddColumn<TimeOnly>(
                name: "WeekdayOpenTime",
                table: "Branches",
                type: "time",
                nullable: false,
                defaultValue: new TimeOnly(0, 0, 0));

            migrationBuilder.AddColumn<TimeOnly>(
                name: "WeekendCloseTime",
                table: "Branches",
                type: "time",
                nullable: false,
                defaultValue: new TimeOnly(0, 0, 0));

            migrationBuilder.AddColumn<TimeOnly>(
                name: "WeekendOpenTime",
                table: "Branches",
                type: "time",
                nullable: false,
                defaultValue: new TimeOnly(0, 0, 0));
        }
    }
}
