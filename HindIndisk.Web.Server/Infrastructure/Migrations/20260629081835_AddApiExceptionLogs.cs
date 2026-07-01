using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HindIndisk.Api.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddApiExceptionLogs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ApiExceptionLogs",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OccurredAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    HttpMethod = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    RequestPath = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    QueryString = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    StatusCode = table.Column<int>(type: "int", nullable: false),
                    ExceptionType = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    ExceptionMessage = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    StackTrace = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UserId = table.Column<long>(type: "bigint", nullable: true),
                    ClientIp = table.Column<string>(type: "nvarchar(45)", maxLength: 45, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ApiExceptionLogs", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ApiExceptionLogs_OccurredAt",
                table: "ApiExceptionLogs",
                column: "OccurredAt");

            migrationBuilder.CreateIndex(
                name: "IX_ApiExceptionLogs_UserId",
                table: "ApiExceptionLogs",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ApiExceptionLogs");
        }
    }
}
