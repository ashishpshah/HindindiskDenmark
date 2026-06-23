using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HindIndisk.Api.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class MakeEmailNullable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Idempotent drops — safe whether the indexes exist or not
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.indexes
                           WHERE object_id = OBJECT_ID('Users') AND name = 'IX_Users_Email')
                    DROP INDEX [IX_Users_Email] ON [Users];");

            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.indexes
                           WHERE object_id = OBJECT_ID('Users') AND name = 'IX_Users_Phone')
                    DROP INDEX [IX_Users_Phone] ON [Users];");

            // Make Email nullable (only if it isn't already)
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.columns
                           WHERE object_id = OBJECT_ID('Users') AND name = 'Email'
                             AND is_nullable = 0)
                    ALTER TABLE [Users] ALTER COLUMN [Email] nvarchar(450) NULL;");

            // Erase every auto-generated placeholder email so those rows become email-null guests
            migrationBuilder.Sql(
                "UPDATE [Users] SET [Email] = NULL WHERE [Email] LIKE '%@auto.hindindisk.dk';");

            // Recreate as filtered unique index (only if absent)
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.indexes
                               WHERE object_id = OBJECT_ID('Users') AND name = 'IX_Users_Email')
                    CREATE UNIQUE INDEX [IX_Users_Email] ON [Users] ([Email])
                        WHERE [Email] IS NOT NULL;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_Email",
                table: "Users");

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "Users",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(450)",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_Phone",
                table: "Users",
                column: "Phone");
        }
    }
}
