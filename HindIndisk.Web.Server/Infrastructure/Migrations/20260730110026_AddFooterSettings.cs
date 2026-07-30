using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HindIndisk.Api.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFooterSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FooterSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false),
                    Copyright = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CopyrightDa = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FooterSettings", x => x.Id);
                });

            migrationBuilder.Sql(@"
INSERT INTO [FooterSettings] ([Id],[Copyright],[CopyrightDa])
VALUES
(1,
 'Hind Indisk Restaurant · Crafted with care in Denmark',
 N'Hind Indisk Restaurant · Lavet med omhu i Danmark'
);
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FooterSettings");
        }
    }
}
