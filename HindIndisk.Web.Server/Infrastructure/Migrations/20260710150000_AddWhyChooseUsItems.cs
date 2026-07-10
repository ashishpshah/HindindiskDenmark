using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HindIndisk.Web.Server.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWhyChooseUsItems : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "WhyChooseUsItems",
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
                    IsActive      = table.Column<bool>(type: "bit", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WhyChooseUsItems", x => x.Id);
                });

            migrationBuilder.Sql(@"
INSERT INTO [WhyChooseUsItems] ([Title], [TitleDa], [Description], [DescriptionDa], [Icon], [SortOrder], [IsActive]) VALUES
('Authentic Recipes', N'Autentiske opskrifter', 'Traditional recipes passed down for generations.',  N'Traditionelle opskrifter nedarvet i generationer.',   'ChefHat',       0, 1),
('Fresh Ingredients', N'Friske ingredienser',   'Locally sourced, hand-picked daily.',               N'Lokalt produceret, håndplukket dagligt.',             'Leaf',          1, 1),
('Fast Delivery',     N'Hurtig levering',        'Hot meals delivered across Denmark.',               N'Varme måltider leveret i hele Danmark.',              'Bike',          2, 1),
('Best Service',      N'Bedste service',         'Warm hospitality and attentive care.',              N'Varm gæstfrihed og opmærksom pleje.',                'HeartHandshake',3, 1);
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "WhyChooseUsItems");
        }
    }
}
