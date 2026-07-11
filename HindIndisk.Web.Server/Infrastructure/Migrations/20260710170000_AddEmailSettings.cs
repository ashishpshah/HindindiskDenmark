using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HindIndisk.Web.Server.Infrastructure.Migrations
{
    public partial class AddEmailSettings : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EmailSettings",
                columns: table => new
                {
                    Id          = table.Column<int>(type: "int", nullable: false),
                    SmtpHost    = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    SmtpPort    = table.Column<int>(type: "int", nullable: false),
                    SmtpUser    = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    SmtpPass    = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    FromName    = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    FromAddress = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    AdminToMail = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    CC          = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    BCC         = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    Enabled     = table.Column<bool>(type: "bit", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmailSettings", x => x.Id);
                });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "EmailSettings");
        }
    }
}
