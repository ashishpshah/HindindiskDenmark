using HindIndisk.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace HindIndisk.Api.Infrastructure;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<Role> Roles => Set<Role>();
    public DbSet<User> Users => Set<User>();
    public DbSet<UserBranch> UserBranches => Set<UserBranch>();
    public DbSet<UserAddress> UserAddresses => Set<UserAddress>();
    public DbSet<Branch> Branches => Set<Branch>();
    public DbSet<Menu> Menus => Set<Menu>();
    public DbSet<MenuItem> MenuItems => Set<MenuItem>();
    public DbSet<MenuLabel> MenuLabels => Set<MenuLabel>();
    public DbSet<MenuItemLabel> MenuItemLabels => Set<MenuItemLabel>();
    public DbSet<MenuItemsMapping> MenuItemsMappings => Set<MenuItemsMapping>();
    public DbSet<BranchMenu> BranchMenus => Set<BranchMenu>();
    public DbSet<BranchMenuItemPrice> BranchMenuItemPrices => Set<BranchMenuItemPrice>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<OrderAppliedOffer> OrderAppliedOffers => Set<OrderAppliedOffer>();
    public DbSet<Reservation> Reservations => Set<Reservation>();
    public DbSet<Offer> Offers => Set<Offer>();
    public DbSet<OfferMenu> OfferMenus => Set<OfferMenu>();
    public DbSet<OfferMenuItem> OfferMenuItems => Set<OfferMenuItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // ── Composite primary keys (join tables) ──────────────────────────────
        modelBuilder.Entity<UserBranch>().HasKey(x => new { x.UserId, x.BranchId });
        modelBuilder.Entity<MenuItemLabel>().HasKey(x => new { x.MenuItemId, x.LabelId });
        modelBuilder.Entity<MenuItemsMapping>().HasKey(x => new { x.MenuId, x.MenuItemId });
        modelBuilder.Entity<BranchMenu>().HasKey(x => new { x.BranchId, x.MenuId });
        modelBuilder.Entity<BranchMenuItemPrice>().HasKey(x => new { x.BranchId, x.MenuItemId });
        modelBuilder.Entity<OrderAppliedOffer>().HasKey(x => new { x.OrderId, x.OfferId });
        modelBuilder.Entity<OfferMenu>().HasKey(x => new { x.OfferId, x.MenuId });
        modelBuilder.Entity<OfferMenuItem>().HasKey(x => new { x.OfferId, x.MenuItemId });

        // ── Unique indexes ────────────────────────────────────────────────────
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<Offer>()
            .HasIndex(o => o.CouponCode)
            .IsUnique()
            .HasFilter("[CouponCode] IS NOT NULL");

        // ── Decimal precision ─────────────────────────────────────────────────
        modelBuilder.Entity<BranchMenuItemPrice>().Property(x => x.Price).HasPrecision(10, 2);
        modelBuilder.Entity<Order>().Property(x => x.Subtotal).HasPrecision(10, 2);
        modelBuilder.Entity<Order>().Property(x => x.DeliveryFee).HasPrecision(10, 2);
        modelBuilder.Entity<Order>().Property(x => x.Tax).HasPrecision(10, 2);
        modelBuilder.Entity<Order>().Property(x => x.Discount).HasPrecision(10, 2);
        modelBuilder.Entity<Order>().Property(x => x.Total).HasPrecision(10, 2);
        modelBuilder.Entity<OrderItem>().Property(x => x.PriceAtPurchase).HasPrecision(10, 2);
        modelBuilder.Entity<OrderAppliedOffer>().Property(x => x.AppliedDiscountAmount).HasPrecision(10, 2);
        modelBuilder.Entity<Offer>().Property(x => x.DiscountValue).HasPrecision(10, 2);
        modelBuilder.Entity<Offer>().Property(x => x.MinimumOrderAmount).HasPrecision(10, 2);

        // ── Order relationships ───────────────────────────────────────────────
        // Cascade delete on owned collections
        modelBuilder.Entity<Order>()
            .HasMany(o => o.OrderItems)
            .WithOne(oi => oi.Order)
            .HasForeignKey(oi => oi.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Order>()
            .HasMany(o => o.AppliedOffers)
            .WithOne(ao => ao.Order)
            .HasForeignKey(ao => ao.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        // Restrict to avoid multiple cascade paths
        modelBuilder.Entity<Order>()
            .HasOne(o => o.User)
            .WithMany(u => u.Orders)
            .HasForeignKey(o => o.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Order>()
            .HasOne(o => o.Branch)
            .WithMany(b => b.Orders)
            .HasForeignKey(o => o.BranchId)
            .OnDelete(DeleteBehavior.Restrict);

        // ── Reservation relationships ─────────────────────────────────────────
        modelBuilder.Entity<Reservation>()
            .HasOne(r => r.User)
            .WithMany(u => u.Reservations)
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Reservation>()
            .HasOne(r => r.Branch)
            .WithMany(b => b.Reservations)
            .HasForeignKey(r => r.BranchId)
            .OnDelete(DeleteBehavior.Restrict);

        // ── UserBranch relationships ──────────────────────────────────────────
        modelBuilder.Entity<UserBranch>()
            .HasOne(ub => ub.User)
            .WithMany(u => u.UserBranches)
            .HasForeignKey(ub => ub.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UserBranch>()
            .HasOne(ub => ub.Branch)
            .WithMany(b => b.UserBranches)
            .HasForeignKey(ub => ub.BranchId)
            .OnDelete(DeleteBehavior.Restrict);

        // ── OrderItem: no cascade from MenuItem/Menu (price is snapshotted) ───
        modelBuilder.Entity<OrderItem>()
            .HasOne(oi => oi.MenuItem)
            .WithMany(m => m.OrderItems)
            .HasForeignKey(oi => oi.MenuItemId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<OrderItem>()
            .HasOne(oi => oi.Menu)
            .WithMany()
            .HasForeignKey(oi => oi.MenuId)
            .OnDelete(DeleteBehavior.Restrict);

        // ── OrderAppliedOffer: no cascade from Offer ──────────────────────────
        modelBuilder.Entity<OrderAppliedOffer>()
            .HasOne(ao => ao.Offer)
            .WithMany(o => o.OrderAppliedOffers)
            .HasForeignKey(ao => ao.OfferId)
            .OnDelete(DeleteBehavior.Restrict);

        // ── Fixed roles — always seeded via migration (HasData) ───────────────
        // BCrypt is NOT used here: HasData values are serialised into the migration
        // snapshot, so any dynamic computation would produce a new migration on
        // every subsequent `dotnet ef migrations add`.  Roles are pure strings —
        // no such issue.  The admin User is seeded at runtime by DataSeeder.
        modelBuilder.Entity<Role>().HasData(
            new Role { Id = 1, Name = "SystemAdmin" },
            new Role { Id = 2, Name = "Admin" },
            new Role { Id = 3, Name = "Customer" }
        );
    }
}
