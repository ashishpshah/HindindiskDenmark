using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HindIndisk.Api.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderScheduledTime : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateOnly>(
                name: "ScheduledDate",
                table: "Orders",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ScheduledTime",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ScheduledDate",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "ScheduledTime",
                table: "Orders");
        }
    }
}
