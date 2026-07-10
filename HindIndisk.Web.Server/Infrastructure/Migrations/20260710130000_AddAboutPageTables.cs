using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HindIndisk.Web.Server.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAboutPageTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AboutPageSettings",
                columns: table => new
                {
                    Id         = table.Column<int>(type: "int", nullable: false),
                    HeroImage  = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    StoryImage = table.Column<string>(type: "nvarchar(max)", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AboutPageSettings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AboutStats",
                columns: table => new
                {
                    Id        = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Value     = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Label     = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LabelDa   = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AboutStats", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AboutMvvItems",
                columns: table => new
                {
                    Id            = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title         = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TitleDa       = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description   = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DescriptionDa = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Icon          = table.Column<string>(type: "nvarchar(50)", nullable: false),
                    SortOrder     = table.Column<int>(type: "int", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AboutMvvItems", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AboutTimelineItems",
                columns: table => new
                {
                    Id            = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Year          = table.Column<string>(type: "nvarchar(10)", nullable: false),
                    Title         = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TitleDa       = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description   = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DescriptionDa = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SortOrder     = table.Column<int>(type: "int", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AboutTimelineItems", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TeamMembers",
                columns: table => new
                {
                    Id        = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name      = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Role      = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RoleDa    = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Image     = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive  = table.Column<bool>(type: "bit", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TeamMembers", x => x.Id);
                });

            // ── Seed data ─────────────────────────────────────────────────────

            migrationBuilder.Sql(@"
INSERT INTO [AboutPageSettings] ([Id], [HeroImage], [StoryImage]) VALUES
(1,
 'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?auto=format&fit=crop&w=1920&q=80',
 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80');
");

            migrationBuilder.Sql(@"
INSERT INTO [AboutStats] ([Value], [Label], [LabelDa], [SortOrder]) VALUES
('20+',  'Years Experience', N'Års erfaring',  0),
('50K+', 'Happy Customers',  N'Glade kunder',  1),
('100+', 'Indian Dishes',    N'Indiske retter', 2),
('2',    'Locations',        N'Restauranter',   3);
");

            migrationBuilder.Sql(@"
INSERT INTO [AboutMvvItems] ([Title], [TitleDa], [Description], [DescriptionDa], [Icon], [SortOrder]) VALUES
('Our Mission', N'Vores mission',
 'Bring authentic Indian cuisine to the Danish table by preparing every spice blend, curry, and bread from scratch with absolute integrity.',
 N'At bringe autentisk indisk madlavning til det danske bord ved at tilberede alle krydderiblandinger, curryretter og brød fra bunden med absolut integritet.',
 'Target', 0),
('Our Vision', N'Vores vision',
 N'To be Denmark''s premier culinary bridge to the Indian subcontinent, known for culinary excellence, warm hospitality, and cultural richness.',
 N'At være Danmarks fremmeste kulinariske bro til det indiske subkontinent, kendt for kulinarisk ekspertise, varm gæstfrihed og kulturel rigdom.',
 'Sparkles', 1),
('Our Values', N'Vores værdier',
 'Rooted in authentic tradition, standard-setting fresh ingredients, and treating every dining guest with the utmost family warmth.',
 N'Forankret i autentisk tradition, friske råvarer af høj klasse og behandling af enhver gæst med den største familievarme.',
 'Heart', 2);
");

            migrationBuilder.Sql(@"
INSERT INTO [AboutTimelineItems] ([Year], [Title], [TitleDa], [Description], [DescriptionDa], [SortOrder]) VALUES
('2004', 'The Beginning',    N'Begyndelsen',       'Our family opens the first kitchen in Aarhus.',                     N'Vores familie åbner det første køkken i Aarhus.',        0),
('2010', 'Growing Roots',    N'Voksende rødder',   'Loyal community of guests across Jutland.',                         N'Et trofastgæstefællesskab i hele Jylland.',              1),
('2017', 'Copenhagen Opens', N'København åbner',   'Second flagship location debuts in Vesterbro.',                     N'Anden flagskibslokation åbner i Vesterbro.',             2),
('2024', 'Award Winning',    N'Prisvinder',         N'Recognized as Denmark''s top Indian restaurant.',                  N'Anerkendt som Danmarks bedste indiske restaurant.',      3);
");

            migrationBuilder.Sql(@"
INSERT INTO [TeamMembers] ([Name], [Role], [RoleDa], [Image], [SortOrder], [IsActive]) VALUES
('Chef Arjun Patel', 'Head Chef',          N'Chefkok',          'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=600&q=80', 0, 1),
('Priya Sharma',     'Sous Chef',          N'Sous Chef',         'https://images.unsplash.com/photo-1607631568010-a87245c0daf8?auto=format&fit=crop&w=600&q=80', 1, 1),
('Anders Berg',      'Restaurant Manager', N'Restaurantleder',  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=600&q=80', 2, 1);
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "TeamMembers");
            migrationBuilder.DropTable(name: "AboutTimelineItems");
            migrationBuilder.DropTable(name: "AboutMvvItems");
            migrationBuilder.DropTable(name: "AboutStats");
            migrationBuilder.DropTable(name: "AboutPageSettings");
        }
    }
}
