using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HindIndisk.Web.Server.Infrastructure.Migrations
{
    public partial class AddHomeStorySectionSettings : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "HomeStorySectionSettings",
                columns: table => new
                {
                    Id                    = table.Column<int>(type: "int", nullable: false),
                    Eyebrow               = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EyebrowDa             = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Title                 = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TitleDa               = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Subtitle              = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SubtitleDa            = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    HeritageBadgeLabel    = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    HeritageBadgeLabelDa  = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    HeritageBadgeSince    = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    HeritageBadgeSinceDa  = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ButtonText            = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ButtonTextDa          = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ButtonLink            = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    MainImage             = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    OverlayImage          = table.Column<string>(type: "nvarchar(max)", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HomeStorySectionSettings", x => x.Id);
                });

            migrationBuilder.Sql(@"
INSERT INTO [HomeStorySectionSettings]
    ([Id],[Eyebrow],[EyebrowDa],[Title],[TitleDa],[Subtitle],[SubtitleDa],
     [HeritageBadgeLabel],[HeritageBadgeLabelDa],[HeritageBadgeSince],[HeritageBadgeSinceDa],
     [ButtonText],[ButtonTextDa],[ButtonLink],[MainImage],[OverlayImage])
VALUES
(1,
 'Our Story',
 N'Vores historie',
 'A Family Kitchen, Rooted In Denmark',
 N'Et familiekøkken, forankret i Danmark',
 'Two decades of crafting authentic Indian cuisine using time-honoured recipes, locally sourced ingredients and a deep respect for the craft of hospitality.',
 N'To årtier med autentisk indisk madlavning med tidshædrende opskrifter, lokalt producerede ingredienser og en dyb respekt for gæstfrihedens håndværk.',
 'Heritage',
 N'Arv',
 'Since 2004',
 N'Siden 2004',
 'Discover Our Story',
 N'Opdage vores historie',
 '/about',
 'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?auto=format&fit=crop&w=900&q=80',
 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80'
);
");

            migrationBuilder.DropColumn(
                name: "HomeStoryMainImage",
                table: "AboutPageSettings");

            migrationBuilder.DropColumn(
                name: "HomeStoryOverlayImage",
                table: "AboutPageSettings");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "HomeStorySectionSettings");

            migrationBuilder.AddColumn<string>(
                name: "HomeStoryMainImage",
                table: "AboutPageSettings",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "https://images.unsplash.com/photo-1505253758473-96b7015fcd40?auto=format&fit=crop&w=900&q=80");

            migrationBuilder.AddColumn<string>(
                name: "HomeStoryOverlayImage",
                table: "AboutPageSettings",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80");
        }
    }
}
