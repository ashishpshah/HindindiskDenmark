using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HindIndisk.Web.Server.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddHomeStoryImages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "HomeStoryMainImage",    table: "AboutPageSettings");
            migrationBuilder.DropColumn(name: "HomeStoryOverlayImage", table: "AboutPageSettings");
        }
    }
}
