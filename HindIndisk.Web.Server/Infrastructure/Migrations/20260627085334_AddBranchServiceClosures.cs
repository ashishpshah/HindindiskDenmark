using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HindIndisk.Api.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBranchServiceClosures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BranchClosurePeriods");

            migrationBuilder.AddColumn<bool>(
                name: "IsCloseOrder",
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

            migrationBuilder.CreateTable(
                name: "BranchServiceClosures",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BranchId = table.Column<long>(type: "bigint", nullable: false),
                    ServiceType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ClosedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReopenedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ClosedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BranchServiceClosures", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BranchServiceClosures_Branches_BranchId",
                        column: x => x.BranchId,
                        principalTable: "Branches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BranchServiceClosures_BranchId",
                table: "BranchServiceClosures",
                column: "BranchId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BranchServiceClosures");

            migrationBuilder.DropColumn(
                name: "IsCloseOrder",
                table: "Branches");

            migrationBuilder.DropColumn(
                name: "IsCloseReservation",
                table: "Branches");

            migrationBuilder.CreateTable(
                name: "BranchClosurePeriods",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BranchId = table.Column<long>(type: "bigint", nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    EndTime = table.Column<TimeOnly>(type: "time", nullable: true),
                    Reason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    StartTime = table.Column<TimeOnly>(type: "time", nullable: true)
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

            migrationBuilder.CreateIndex(
                name: "IX_BranchClosurePeriods_BranchId",
                table: "BranchClosurePeriods",
                column: "BranchId");
        }
    }
}
