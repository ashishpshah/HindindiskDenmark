using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HindIndisk.Api.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class MakeAboutContentBranchScoped : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "SmtpUser",
                table: "EmailSettings",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500);

            migrationBuilder.AlterColumn<string>(
                name: "SmtpPass",
                table: "EmailSettings",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500);

            migrationBuilder.AlterColumn<string>(
                name: "SmtpHost",
                table: "EmailSettings",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500);

            migrationBuilder.AlterColumn<string>(
                name: "FromName",
                table: "EmailSettings",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500);

            migrationBuilder.AlterColumn<string>(
                name: "FromAddress",
                table: "EmailSettings",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500);

            migrationBuilder.AlterColumn<string>(
                name: "CC",
                table: "EmailSettings",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(1000)",
                oldMaxLength: 1000);

            migrationBuilder.AlterColumn<string>(
                name: "BCC",
                table: "EmailSettings",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(1000)",
                oldMaxLength: 1000);

            migrationBuilder.AlterColumn<string>(
                name: "AdminToMail",
                table: "EmailSettings",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500);

            // ── AboutTimelineItems / TeamMembers: add BranchId, fan existing rows
            //    out to every branch, drop the original branch-less rows ──────────

            migrationBuilder.AddColumn<long>(
                name: "BranchId",
                table: "AboutTimelineItems",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "BranchId",
                table: "TeamMembers",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.Sql(@"
INSERT INTO [AboutTimelineItems] ([BranchId],[Year],[Title],[TitleDa],[Description],[DescriptionDa],[SortOrder])
SELECT b.[Id], t.[Year], t.[Title], t.[TitleDa], t.[Description], t.[DescriptionDa], t.[SortOrder]
FROM [AboutTimelineItems] t
CROSS JOIN [Branches] b
WHERE t.[BranchId] = 0;

DELETE FROM [AboutTimelineItems] WHERE [BranchId] = 0;
");

            migrationBuilder.Sql(@"
INSERT INTO [TeamMembers] ([BranchId],[Name],[Role],[RoleDa],[Image],[SortOrder],[IsActive])
SELECT b.[Id], m.[Name], m.[Role], m.[RoleDa], m.[Image], m.[SortOrder], m.[IsActive]
FROM [TeamMembers] m
CROSS JOIN [Branches] b
WHERE m.[BranchId] = 0;

DELETE FROM [TeamMembers] WHERE [BranchId] = 0;
");

            // ── AboutPageSettings: PK type changes int -> bigint identity, so the
            //    column can't be altered in place (SQL Server requires drop/recreate
            //    for an IDENTITY change) — build the new table, fan the single
            //    existing row out to every branch, then swap it in ────────────────

            migrationBuilder.CreateTable(
                name: "AboutPageSettingsNew",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BranchId = table.Column<long>(type: "bigint", nullable: false),
                    HeroImage = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    StoryImage = table.Column<string>(type: "nvarchar(max)", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AboutPageSettingsNew", x => x.Id);
                });

            migrationBuilder.Sql(@"
INSERT INTO [AboutPageSettingsNew] ([BranchId],[HeroImage],[StoryImage])
SELECT b.[Id], ISNULL(s.[HeroImage], N''), ISNULL(s.[StoryImage], N'')
FROM [Branches] b
OUTER APPLY (SELECT TOP (1) [HeroImage], [StoryImage] FROM [AboutPageSettings]) s;
");

            migrationBuilder.DropTable(name: "AboutPageSettings");

            migrationBuilder.RenameTable(name: "AboutPageSettingsNew", newName: "AboutPageSettings");

            migrationBuilder.Sql("EXEC sp_rename N'[PK_AboutPageSettingsNew]', N'PK_AboutPageSettings', N'OBJECT';");

            // ── Indexes + FKs (now safe: every row has a real BranchId) ──────────

            migrationBuilder.CreateIndex(
                name: "IX_AboutTimelineItems_BranchId",
                table: "AboutTimelineItems",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_TeamMembers_BranchId",
                table: "TeamMembers",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_AboutPageSettings_BranchId",
                table: "AboutPageSettings",
                column: "BranchId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_AboutTimelineItems_Branches_BranchId",
                table: "AboutTimelineItems",
                column: "BranchId",
                principalTable: "Branches",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TeamMembers_Branches_BranchId",
                table: "TeamMembers",
                column: "BranchId",
                principalTable: "Branches",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_AboutPageSettings_Branches_BranchId",
                table: "AboutPageSettings",
                column: "BranchId",
                principalTable: "Branches",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AboutPageSettings_Branches_BranchId",
                table: "AboutPageSettings");

            migrationBuilder.DropForeignKey(
                name: "FK_AboutTimelineItems_Branches_BranchId",
                table: "AboutTimelineItems");

            migrationBuilder.DropForeignKey(
                name: "FK_TeamMembers_Branches_BranchId",
                table: "TeamMembers");

            migrationBuilder.DropIndex(
                name: "IX_AboutPageSettings_BranchId",
                table: "AboutPageSettings");

            migrationBuilder.DropIndex(
                name: "IX_AboutTimelineItems_BranchId",
                table: "AboutTimelineItems");

            migrationBuilder.DropIndex(
                name: "IX_TeamMembers_BranchId",
                table: "TeamMembers");

            // ── Collapse each table back to a single branch's rows (best-effort —
            //    once branches have diverged this can't perfectly restore the
            //    original global-only state) before dropping BranchId ────────────

            migrationBuilder.Sql(@"DELETE FROM [AboutTimelineItems] WHERE [BranchId] <> (SELECT MIN([BranchId]) FROM [AboutTimelineItems]);");
            migrationBuilder.DropColumn(name: "BranchId", table: "AboutTimelineItems");

            migrationBuilder.Sql(@"DELETE FROM [TeamMembers] WHERE [BranchId] <> (SELECT MIN([BranchId]) FROM [TeamMembers]);");
            migrationBuilder.DropColumn(name: "BranchId", table: "TeamMembers");

            migrationBuilder.CreateTable(
                name: "AboutPageSettingsOld",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false),
                    HeroImage = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    StoryImage = table.Column<string>(type: "nvarchar(max)", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AboutPageSettingsOld", x => x.Id);
                });

            migrationBuilder.Sql(@"
INSERT INTO [AboutPageSettingsOld] ([Id],[HeroImage],[StoryImage])
SELECT TOP (1) 1, [HeroImage], [StoryImage] FROM [AboutPageSettings] ORDER BY [BranchId];
");

            migrationBuilder.DropTable(name: "AboutPageSettings");

            migrationBuilder.RenameTable(name: "AboutPageSettingsOld", newName: "AboutPageSettings");

            migrationBuilder.Sql("EXEC sp_rename N'[PK_AboutPageSettingsOld]', N'PK_AboutPageSettings', N'OBJECT';");

            migrationBuilder.AlterColumn<string>(
                name: "SmtpUser",
                table: "EmailSettings",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "SmtpPass",
                table: "EmailSettings",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "SmtpHost",
                table: "EmailSettings",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "FromName",
                table: "EmailSettings",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "FromAddress",
                table: "EmailSettings",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "CC",
                table: "EmailSettings",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "BCC",
                table: "EmailSettings",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "AdminToMail",
                table: "EmailSettings",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");
        }
    }
}
