using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HindIndisk.Web.Server.Infrastructure.Migrations
{
    public partial class AddOrderStatusTables : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ── Drop index that conflicts (from earlier migration) ───────
            migrationBuilder.DropIndex(
                name: "IX_GalleryImages_SortOrder",
                table: "GalleryImages");

            // ── Add OrderStatusId as nullable first ─────────────────────
            migrationBuilder.AddColumn<long>(
                name: "OrderStatusId",
                table: "Orders",
                type: "bigint",
                nullable: true);

            // ── Create OrderStatuses table ──────────────────────────────
            migrationBuilder.CreateTable(
                name: "OrderStatuses",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    NameDa = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ServiceType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    Color = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    IsTerminal = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderStatuses", x => x.Id);
                });

            // ── Seed OrderStatuses ──────────────────────────────────────
            // SET IDENTITY_INSERT for explicit Id values
            migrationBuilder.Sql("SET IDENTITY_INSERT [OrderStatuses] ON");

            migrationBuilder.Sql(@"
INSERT INTO [OrderStatuses] ([Id],[Name],[NameDa],[ServiceType],[DisplayOrder],[Color],[IsTerminal],[IsActive],[CreatedAt])
VALUES
(1, 'New',           N'Ny',            'All',     1, '#3B82F6', 0, 1, GETUTCDATE()),
(2, 'Preparing',     N'Forbereder',    'All',     2, '#F59E0B', 0, 1, GETUTCDATE()),
(3, 'Ready',         N'Klar',          'All',     3, '#06B6D4', 0, 1, GETUTCDATE()),
(4, 'Ready for Pick up', N'Klar til afhentning', 'Pickup', 4, '#8B5CF6', 0, 1, GETUTCDATE()),
(5, 'Delivered',     N'Leveret',       'All',     5, '#10B981', 1, 1, GETUTCDATE()),
(6, 'Cancelled',     N'Annulleret',    'All',     6, '#EF4444', 1, 1, GETUTCDATE())
");

            migrationBuilder.Sql("SET IDENTITY_INSERT [OrderStatuses] OFF");

            // ── Migrate existing orders ─────────────────────────────────
            // Map old statuses to new OrderStatusId + rename status strings
            migrationBuilder.Sql(@"
UPDATE [Orders] SET [OrderStatusId] = 1, [Status] = 'New'
WHERE [Status] = 'Placed'
");
            migrationBuilder.Sql(@"
UPDATE [Orders] SET [OrderStatusId] = 2, [Status] = 'Preparing'
WHERE [Status] = 'Accepted'
");
            migrationBuilder.Sql(@"
UPDATE [Orders] SET [OrderStatusId] = 2, [Status] = 'Preparing'
WHERE [Status] = 'Preparing'
");
            migrationBuilder.Sql(@"
UPDATE [Orders] SET [OrderStatusId] = 3, [Status] = 'Ready'
WHERE [Status] = 'Ready'
");
            migrationBuilder.Sql(@"
UPDATE [Orders] SET [OrderStatusId] = 5, [Status] = 'Delivered'
WHERE [Status] IN ('OutForDelivery', 'Completed')
");
            migrationBuilder.Sql(@"
UPDATE [Orders] SET [OrderStatusId] = 6, [Status] = 'Cancelled'
WHERE [Status] = 'Cancelled'
");

            // ── Update OrderStatusHistory ──────────────────────────────
            migrationBuilder.Sql(@"
UPDATE [OrderStatusHistories] SET [Status] = 'New'
WHERE [Status] = 'Placed'
");
            migrationBuilder.Sql(@"
UPDATE [OrderStatusHistories] SET [Status] = 'Preparing'
WHERE [Status] = 'Accepted'
");
            migrationBuilder.Sql(@"
UPDATE [OrderStatusHistories] SET [Status] = 'Delivered'
WHERE [Status] IN ('OutForDelivery', 'Completed')
");

            // ── Make OrderStatusId non-nullable ─────────────────────────
            migrationBuilder.Sql("ALTER TABLE [Orders] ALTER COLUMN [OrderStatusId] bigint NOT NULL");

            // ── Create OrderStatusTransitions table ─────────────────────
            migrationBuilder.CreateTable(
                name: "OrderStatusTransitions",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FromStatusId = table.Column<long>(type: "bigint", nullable: false),
                    ToStatusId = table.Column<long>(type: "bigint", nullable: false),
                    ServiceType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderStatusTransitions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrderStatusTransitions_OrderStatuses_FromStatusId",
                        column: x => x.FromStatusId,
                        principalTable: "OrderStatuses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OrderStatusTransitions_OrderStatuses_ToStatusId",
                        column: x => x.ToStatusId,
                        principalTable: "OrderStatuses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            // ── Seed OrderStatusTransitions ─────────────────────────────
            migrationBuilder.Sql(@"
INSERT INTO [OrderStatusTransitions] ([FromStatusId],[ToStatusId],[ServiceType])
VALUES
(1, 2, 'All'),       -- New → Preparing
(1, 6, 'All'),       -- New → Cancelled
(2, 3, 'All'),       -- Preparing → Ready
(2, 6, 'All'),       -- Preparing → Cancelled
(3, 4, 'Pickup'),    -- Ready → Ready for Pick up (pickup only)
(3, 5, 'Delivery'),  -- Ready → Delivered (delivery only)
(3, 6, 'All'),       -- Ready → Cancelled
(4, 5, 'All'),       -- Ready for Pick up → Delivered
(4, 6, 'All')        -- Ready for Pick up → Cancelled
");

            // ── Indexes ─────────────────────────────────────────────────
            migrationBuilder.CreateIndex(
                name: "IX_Orders_OrderStatusId",
                table: "Orders",
                column: "OrderStatusId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderStatuses_Name",
                table: "OrderStatuses",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrderStatusTransitions_FromStatusId",
                table: "OrderStatusTransitions",
                column: "FromStatusId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderStatusTransitions_ToStatusId",
                table: "OrderStatusTransitions",
                column: "ToStatusId");

            // ── FK from Orders → OrderStatuses ──────────────────────────
            migrationBuilder.AddForeignKey(
                name: "FK_Orders_OrderStatuses_OrderStatusId",
                table: "Orders",
                column: "OrderStatusId",
                principalTable: "OrderStatuses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Order matters: remove FK first
            migrationBuilder.DropForeignKey(
                name: "FK_Orders_OrderStatuses_OrderStatusId",
                table: "Orders");

            // Drop tables we created
            migrationBuilder.DropTable(name: "OrderStatusTransitions");
            migrationBuilder.DropTable(name: "OrderStatuses");

            // Revert OrderStatusId + index
            migrationBuilder.DropIndex(
                name: "IX_Orders_OrderStatusId",
                table: "Orders");

            // Revert status strings back to old values
            migrationBuilder.Sql(@"
UPDATE [Orders] SET [Status] = 'Placed'        WHERE [Status] = 'New'
");
            migrationBuilder.Sql(@"
UPDATE [Orders] SET [Status] = 'Accepted'      WHERE [Status] = 'Preparing' AND [OrderStatusId] IS NULL
");
            // Simple revert: set back all the ones we changed
            // This is a best-effort revert — exact mapping depends on what we changed
            migrationBuilder.Sql(@"
UPDATE [OrderStatusHistories] SET [Status] = 'Placed'  WHERE [Status] = 'New'
");
            migrationBuilder.Sql(@"
UPDATE [OrderStatusHistories] SET [Status] = 'Accepted' WHERE [Status] = 'Preparing'
");
            migrationBuilder.Sql(@"
UPDATE [OrderStatusHistories] SET [Status] = 'Completed' WHERE [Status] = 'Delivered'
");

            migrationBuilder.DropColumn(
                name: "OrderStatusId",
                table: "Orders");

            // Restore the gallery index
            migrationBuilder.CreateIndex(
                name: "IX_GalleryImages_SortOrder",
                table: "GalleryImages",
                column: "SortOrder");
        }
    }
}
