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
    public DbSet<Branch>               Branches             => Set<Branch>();
    public DbSet<BranchDaySchedule>    BranchDaySchedules   => Set<BranchDaySchedule>();
    public DbSet<BranchServiceClosure> BranchServiceClosures => Set<BranchServiceClosure>();
    public DbSet<BranchClosure>        BranchClosures       => Set<BranchClosure>();
    public DbSet<Menu> Menus => Set<Menu>();
    public DbSet<MenuItem> MenuItems => Set<MenuItem>();
    public DbSet<MenuLabel> MenuLabels => Set<MenuLabel>();
    public DbSet<MenuItemLabel> MenuItemLabels => Set<MenuItemLabel>();
    public DbSet<MenuItemsMapping> MenuItemsMappings => Set<MenuItemsMapping>();
    public DbSet<BranchMenu> BranchMenus => Set<BranchMenu>();
    public DbSet<BranchMenuItemPrice> BranchMenuItemPrices => Set<BranchMenuItemPrice>();
    public DbSet<OrderStatus>         OrderStatuses         => Set<OrderStatus>();
    public DbSet<OrderStatusTransition> OrderStatusTransitions => Set<OrderStatusTransition>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<OrderAppliedOffer> OrderAppliedOffers => Set<OrderAppliedOffer>();
    public DbSet<OrderStatusHistory> OrderStatusHistories => Set<OrderStatusHistory>();
    public DbSet<Reservation> Reservations => Set<Reservation>();
    public DbSet<Offer> Offers => Set<Offer>();
    public DbSet<OfferMenu> OfferMenus => Set<OfferMenu>();
    public DbSet<OfferMenuItem> OfferMenuItems => Set<OfferMenuItem>();
    public DbSet<ApiExceptionLog> ApiExceptionLogs => Set<ApiExceptionLog>();
    public DbSet<PasswordOtp>    PasswordOtps     => Set<PasswordOtp>();
    public DbSet<RegistrationOtp> RegistrationOtps => Set<RegistrationOtp>();
    public DbSet<HeroSlide>          HeroSlides          => Set<HeroSlide>();
    public DbSet<GalleryImage>       GalleryImages       => Set<GalleryImage>();
    public DbSet<WhyChooseUsItem>    WhyChooseUsItems    => Set<WhyChooseUsItem>();
    public DbSet<HomeStorySectionSettings> HomeStorySectionSettings => Set<HomeStorySectionSettings>();
    public DbSet<FooterSettings> FooterSettings => Set<FooterSettings>();
    public DbSet<AboutPageSettings>  AboutPageSettings   => Set<AboutPageSettings>();
    public DbSet<AboutStat>          AboutStats          => Set<AboutStat>();
    public DbSet<AboutMvvItem>       AboutMvvItems       => Set<AboutMvvItem>();
    public DbSet<AboutTimelineItem>  AboutTimelineItems  => Set<AboutTimelineItem>();
    public DbSet<TeamMember>         TeamMembers         => Set<TeamMember>();
    public DbSet<EmailConfig>        EmailConfigs        => Set<EmailConfig>();
    public DbSet<BranchEmailRecipients> BranchEmailRecipients => Set<BranchEmailRecipients>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // ── BranchServiceClosure ──────────────────────────────────────────────
        modelBuilder.Entity<BranchServiceClosure>()
            .HasOne(c => c.Branch)
            .WithMany(b => b.ServiceClosures)
            .HasForeignKey(c => c.BranchId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── BranchClosure: scheduled / recurring closures ────────────────────
        modelBuilder.Entity<BranchClosure>()
            .HasIndex(c => new { c.BranchId, c.ClosureType });

        modelBuilder.Entity<BranchClosure>()
            .HasOne(c => c.Branch)
            .WithMany(b => b.Closures)
            .HasForeignKey(c => c.BranchId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── BranchDaySchedule: unique per branch + day ───────────────────────
        modelBuilder.Entity<BranchDaySchedule>()
            .HasIndex(s => new { s.BranchId, s.DayOfWeek })
            .IsUnique();

        modelBuilder.Entity<BranchDaySchedule>()
            .HasOne(s => s.Branch)
            .WithMany(b => b.DaySchedules)
            .HasForeignKey(s => s.BranchId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── AboutPageSettings: one row per branch ────────────────────────────
        modelBuilder.Entity<AboutPageSettings>()
            .HasIndex(s => s.BranchId)
            .IsUnique();

        modelBuilder.Entity<AboutPageSettings>()
            .HasOne(s => s.Branch)
            .WithOne(b => b.AboutPageSettings)
            .HasForeignKey<AboutPageSettings>(s => s.BranchId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── AboutTimelineItem: many per branch ───────────────────────────────
        modelBuilder.Entity<AboutTimelineItem>()
            .HasIndex(t => t.BranchId);

        modelBuilder.Entity<AboutTimelineItem>()
            .HasOne(t => t.Branch)
            .WithMany(b => b.AboutTimelineItems)
            .HasForeignKey(t => t.BranchId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── TeamMember: many per branch ───────────────────────────────────────
        modelBuilder.Entity<TeamMember>()
            .HasIndex(m => m.BranchId);

        modelBuilder.Entity<TeamMember>()
            .HasOne(m => m.Branch)
            .WithMany(b => b.TeamMembers)
            .HasForeignKey(m => m.BranchId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── BranchEmailRecipients: one row per branch ────────────────────────
        modelBuilder.Entity<BranchEmailRecipients>()
            .HasIndex(r => r.BranchId)
            .IsUnique();

        modelBuilder.Entity<BranchEmailRecipients>()
            .HasOne(r => r.Branch)
            .WithOne(b => b.EmailRecipients)
            .HasForeignKey<BranchEmailRecipients>(r => r.BranchId)
            .OnDelete(DeleteBehavior.Cascade);

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
            .IsUnique()
            .HasFilter("[Email] IS NOT NULL");

        modelBuilder.Entity<Offer>()
            .HasIndex(o => o.CouponCode)
            .IsUnique()
            .HasFilter("[CouponCode] IS NOT NULL");

        // ── Decimal precision ─────────────────────────────────────────────────
        modelBuilder.Entity<BranchMenuItemPrice>().Property(x => x.Price).HasPrecision(10, 2);

        // ── HeroSlide ─────────────────────────────────────────────────
        modelBuilder.Entity<HeroSlide>()
            .Property(h => h.CtaData)
            .HasColumnType("nvarchar(max)");

        modelBuilder.Entity<HeroSlide>()
            .HasIndex(h => h.SortOrder);

        // ── Single-row settings tables — no IDENTITY ─────────────────────────
        modelBuilder.Entity<HomeStorySectionSettings>()
            .Property(s => s.Id)
            .ValueGeneratedNever();
        modelBuilder.Entity<FooterSettings>()
            .Property(s => s.Id)
            .ValueGeneratedNever();
        modelBuilder.Entity<EmailConfig>()
            .ToTable("EmailSettings")
            .Property(s => s.Id)
            .ValueGeneratedNever();
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

        modelBuilder.Entity<Order>()
            .HasMany(o => o.StatusHistories)
            .WithOne(h => h.Order)
            .HasForeignKey(h => h.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        // Order.UserId is a plain scalar, not a modeled relationship — 0 means guest and
        // doesn't need to reference a real Users row. Keep a plain index for the
        // WHERE UserId = X lookups in GetMyOrdersAsync/GetMyAsync.
        modelBuilder.Entity<Order>().HasIndex(o => o.UserId);

        modelBuilder.Entity<Order>()
            .HasOne(o => o.Branch)
            .WithMany(b => b.Orders)
            .HasForeignKey(o => o.BranchId)
            .OnDelete(DeleteBehavior.Restrict);

        // ── Reservation relationships ─────────────────────────────────────────
        modelBuilder.Entity<Reservation>().HasIndex(r => r.UserId);

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

        // ── Branch defaults ───────────────────────────────────────────────────
        modelBuilder.Entity<Branch>()
            .Property(b => b.MaxAdvanceDays)
            .HasDefaultValue(7);

        // ── MenuItem defaults ─────────────────────────────────────────────────
        modelBuilder.Entity<MenuItem>()
            .Property(m => m.Code)
            .HasDefaultValue(0);

        // ── ApiExceptionLog ───────────────────────────────────────────────────
        modelBuilder.Entity<ApiExceptionLog>()
            .Property(e => e.StackTrace)
            .HasColumnType("nvarchar(max)");

        modelBuilder.Entity<ApiExceptionLog>()
            .HasIndex(e => e.OccurredAt);

        modelBuilder.Entity<ApiExceptionLog>()
            .HasIndex(e => e.UserId);

        // ── PasswordOtp ───────────────────────────────────────────────────────
        modelBuilder.Entity<PasswordOtp>()
            .HasIndex(o => o.Email);

        modelBuilder.Entity<PasswordOtp>()
            .HasIndex(o => o.CreatedAt);

        // ── RegistrationOtp ───────────────────────────────────────────────────
        modelBuilder.Entity<RegistrationOtp>()
            .HasIndex(o => o.Email);

        modelBuilder.Entity<RegistrationOtp>()
            .HasIndex(o => o.CreatedAt);

        // ── OrderStatus ───────────────────────────────────────────────────────
        modelBuilder.Entity<OrderStatus>()
            .HasIndex(s => s.Name)
            .IsUnique();

        modelBuilder.Entity<OrderStatus>()
            .Property(s => s.ServiceType)
            .HasMaxLength(20);

        modelBuilder.Entity<OrderStatus>()
            .Property(s => s.Color)
            .HasMaxLength(20);

        // ── OrderStatusTransition ─────────────────────────────────────────────
        modelBuilder.Entity<OrderStatusTransition>()
            .HasOne(t => t.FromStatus)
            .WithMany(s => s.FromTransitions)
            .HasForeignKey(t => t.FromStatusId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<OrderStatusTransition>()
            .HasOne(t => t.ToStatus)
            .WithMany(s => s.ToTransitions)
            .HasForeignKey(t => t.ToStatusId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<OrderStatusTransition>()
            .Property(t => t.ServiceType)
            .HasMaxLength(20);

        // ── Order → OrderStatus FK ────────────────────────────────────────────
        modelBuilder.Entity<Order>()
            .HasOne(o => o.OrderStatus)
            .WithMany()
            .HasForeignKey(o => o.OrderStatusId)
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
