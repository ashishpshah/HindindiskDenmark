using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HindIndisk.Api.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class MakeAdminRecipientsBranchScoped : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BranchEmailRecipients",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BranchId = table.Column<long>(type: "bigint", nullable: false),
                    AdminToMail = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CC = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BCC = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BranchEmailRecipients", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BranchEmailRecipients_Branches_BranchId",
                        column: x => x.BranchId,
                        principalTable: "Branches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            // Fan the single global row's AdminToMail/CC/BCC out to every existing branch,
            // before those columns are dropped from EmailSettings below.
            migrationBuilder.Sql(@"
INSERT INTO [BranchEmailRecipients] ([BranchId],[AdminToMail],[CC],[BCC])
SELECT b.[Id], ISNULL(s.[AdminToMail], N''), ISNULL(s.[CC], N''), ISNULL(s.[BCC], N'')
FROM [Branches] b
OUTER APPLY (SELECT TOP (1) [AdminToMail],[CC],[BCC] FROM [EmailSettings]) s;
");

            migrationBuilder.CreateIndex(
                name: "IX_BranchEmailRecipients_BranchId",
                table: "BranchEmailRecipients",
                column: "BranchId",
                unique: true);

            migrationBuilder.DropColumn(
                name: "AdminToMail",
                table: "EmailSettings");

            migrationBuilder.DropColumn(
                name: "BCC",
                table: "EmailSettings");

            migrationBuilder.DropColumn(
                name: "CC",
                table: "EmailSettings");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AdminToMail",
                table: "EmailSettings",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "BCC",
                table: "EmailSettings",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CC",
                table: "EmailSettings",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            // Best-effort collapse: pull the lowest-BranchId row back into the global row
            migrationBuilder.Sql(@"
UPDATE [EmailSettings]
SET [AdminToMail] = r.[AdminToMail], [CC] = r.[CC], [BCC] = r.[BCC]
FROM [BranchEmailRecipients] r
WHERE r.[BranchId] = (SELECT MIN([BranchId]) FROM [BranchEmailRecipients]);
");

            migrationBuilder.DropTable(
                name: "BranchEmailRecipients");
        }
    }
}
