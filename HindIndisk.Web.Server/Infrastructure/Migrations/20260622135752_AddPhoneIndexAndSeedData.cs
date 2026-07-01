using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HindIndisk.Api.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPhoneIndexAndSeedData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Truncate Users.Phone to nvarchar(30) so it can be indexed
            // (nvarchar(max) cannot be used as an index key in SQL Server)
            migrationBuilder.Sql(@"
                IF EXISTS (
                    SELECT 1 FROM sys.columns
                    WHERE object_id = OBJECT_ID('Users') AND name = 'Phone'
                      AND max_length = -1
                )
                BEGIN
                    ALTER TABLE [Users] ALTER COLUMN [Phone] nvarchar(30) NOT NULL;
                END
            ");

            // Now create the phone index (idempotent)
            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT 1 FROM sys.indexes
                    WHERE object_id = OBJECT_ID('Users') AND name = 'IX_Users_Phone'
                )
                    CREATE INDEX [IX_Users_Phone] ON [Users] ([Phone]);
            ");

            // Seed admin user if not already present (guarded by email for idempotency)
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM [Users] WHERE [Email] = 'admin@hindindisk.dk')
                    INSERT INTO [Users] ([Firstname],[Lastname],[Email],[PasswordHash],[Phone],[RoleId],[CreatedAt])
                    VALUES ('Hind','Admin','admin@hindindisk.dk',
                            '$2a$11$gZirgnRDh62ZX3rsjRFkNe8AbeutS5EDc1pGNIWWEAAUZN9Vh4B9G',
                            '+4586123456', 2, GETUTCDATE());
            ");

            // Seed system admin if not already present
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM [Users] WHERE [Email] = 'sysadmin@hindindisk.dk')
                    INSERT INTO [Users] ([Firstname],[Lastname],[Email],[PasswordHash],[Phone],[RoleId],[CreatedAt])
                    VALUES ('System','Admin','sysadmin@hindindisk.dk',
                            '$2a$11$gZirgnRDh62ZX3rsjRFkNe8AbeutS5EDc1pGNIWWEAAUZN9Vh4B9G',
                            '+4586123457', 1, GETUTCDATE());
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP INDEX IF EXISTS [IX_Users_Phone] ON [Users];");
        }
    }
}
