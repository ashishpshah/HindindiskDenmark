using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HindIndisk.Web.Server.Infrastructure.Migrations
{
    public partial class AddClosureFields : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Branch instant-closure notes
            migrationBuilder.AddColumn<string>(
                name: "CloseOrderNote",
                table: "Branches",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CloseReservationNote",
                table: "Branches",
                type: "nvarchar(max)",
                nullable: true);

            // BranchServiceClosure history note
            migrationBuilder.AddColumn<string>(
                name: "Note",
                table: "BranchServiceClosures",
                type: "nvarchar(max)",
                nullable: true);

            // BranchClosure partial-day time window
            migrationBuilder.AddColumn<TimeOnly>(
                name: "StartTime",
                table: "BranchClosures",
                type: "time",
                nullable: true);

            migrationBuilder.AddColumn<TimeOnly>(
                name: "EndTime",
                table: "BranchClosures",
                type: "time",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "CloseOrderNote",       table: "Branches");
            migrationBuilder.DropColumn(name: "CloseReservationNote", table: "Branches");
            migrationBuilder.DropColumn(name: "Note",                 table: "BranchServiceClosures");
            migrationBuilder.DropColumn(name: "StartTime",            table: "BranchClosures");
            migrationBuilder.DropColumn(name: "EndTime",              table: "BranchClosures");
        }
    }
}
