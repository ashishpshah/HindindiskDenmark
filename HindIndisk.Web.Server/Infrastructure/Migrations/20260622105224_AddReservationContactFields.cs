using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HindIndisk.Api.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddReservationContactFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // These columns were added to the Reservation entity after InitialCreate was applied.
            // Guard against re-running: add only when absent.
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Reservations') AND name = 'ContactName')
                    ALTER TABLE [Reservations] ADD [ContactName] nvarchar(max) NOT NULL DEFAULT '';
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Reservations') AND name = 'ContactPhone')
                    ALTER TABLE [Reservations] ADD [ContactPhone] nvarchar(max) NOT NULL DEFAULT '';
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Reservations') AND name = 'ContactEmail')
                    ALTER TABLE [Reservations] ADD [ContactEmail] nvarchar(max) NOT NULL DEFAULT '';
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(table: "Reservations", name: "ContactName");
            migrationBuilder.DropColumn(table: "Reservations", name: "ContactPhone");
            migrationBuilder.DropColumn(table: "Reservations", name: "ContactEmail");
        }
    }
}
