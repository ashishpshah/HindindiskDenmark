using HindIndisk.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace HindIndisk.Api.Infrastructure;

/// <summary>
/// Idempotent runtime seeder — safe to call on every startup.
/// Roles (Id 1-3) are seeded via EF Core HasData in ApplicationDbContext.
/// Every table with an explicit PK needs SET IDENTITY_INSERT ON/OFF on the
/// same physical connection (SQL Server setting is connection-scoped).
/// </summary>
public static class DataSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context)
    {
        // ── Fixed admin user (Id = 1) ─────────────────────────────────────────
        if (!await context.Users.AnyAsync(u => u.Id == 1))
        {
            await context.Database.OpenConnectionAsync();
            try
            {
                await context.Database.ExecuteSqlRawAsync("SET IDENTITY_INSERT [Users] ON");
                await context.Users.AddAsync(new User
                {
                    Id = 1,
                    Firstname = "System",
                    Lastname = "Admin",
                    Email = "admin@hindindisk.dk",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                    Phone = "+45 00 00 00 00",
                    RoleId = 1,
                    CreatedAt = DateTime.UtcNow,
                });
                await context.SaveChangesAsync();
                await context.Database.ExecuteSqlRawAsync("SET IDENTITY_INSERT [Users] OFF");
            }
            finally
            {
                await context.Database.CloseConnectionAsync();
            }
        }

        // ── Reference data — seed once ────────────────────────────────────────
        if (await context.Menus.AnyAsync()) return;

        await context.Database.OpenConnectionAsync();
        try
        {
            // 1. MenuLabels ────────────────────────────────────────────────────
            await context.Database.ExecuteSqlRawAsync("SET IDENTITY_INSERT [MenuLabels] ON");
            await context.MenuLabels.AddRangeAsync(
                new MenuLabel { Id = 1, Name = "Vegetarian",      Type = "Dietary"  },
                new MenuLabel { Id = 2, Name = "Non-Vegetarian",  Type = "Dietary"  },
                new MenuLabel { Id = 3, Name = "Contains Dairy",  Type = "Allergen" },
                new MenuLabel { Id = 4, Name = "Contains Gluten", Type = "Allergen" },
                new MenuLabel { Id = 5, Name = "Contains Nuts",   Type = "Allergen" }
            );
            await context.SaveChangesAsync();
            await context.Database.ExecuteSqlRawAsync("SET IDENTITY_INSERT [MenuLabels] OFF");

            // 2. Menus (categories) ────────────────────────────────────────────
            await context.Database.ExecuteSqlRawAsync("SET IDENTITY_INSERT [Menus] ON");
            await context.Menus.AddRangeAsync(
                new Menu { Id = 1, Name = "Starters",    Description = "Light bites and appetisers",            IsActive = true },
                new Menu { Id = 2, Name = "Main Course", Description = "Hearty main dishes",                    IsActive = true },
                new Menu { Id = 3, Name = "Rice",        Description = "Fragrant basmati rice dishes",          IsActive = true },
                new Menu { Id = 4, Name = "Bread",       Description = "Freshly baked breads from the tandoor", IsActive = true },
                new Menu { Id = 5, Name = "Desserts",    Description = "Sweet endings",                         IsActive = true },
                new Menu { Id = 6, Name = "Drinks",      Description = "Refreshing beverages",                  IsActive = true }
            );
            await context.SaveChangesAsync();
            await context.Database.ExecuteSqlRawAsync("SET IDENTITY_INSERT [Menus] OFF");

            // 3. Menu items ────────────────────────────────────────────────────
            await context.Database.ExecuteSqlRawAsync("SET IDENTITY_INSERT [MenuItems] ON");
            await context.MenuItems.AddRangeAsync(
                new MenuItem { Id =  1, Name = "Samosa",            SpicyLevel = 1, Description = "Crispy pastry filled with spiced potatoes and peas.",   ImageUrl = "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80" },
                new MenuItem { Id =  2, Name = "Paneer Tikka",      SpicyLevel = 2, Description = "Marinated cottage cheese, flame grilled.",               ImageUrl = "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80" },
                new MenuItem { Id =  3, Name = "Chicken Pakora",    SpicyLevel = 2, Description = "Golden fried marinated chicken bites.",                   ImageUrl = "https://images.unsplash.com/photo-1606491048802-8342506d6471?auto=format&fit=crop&w=800&q=80" },
                new MenuItem { Id =  4, Name = "Butter Chicken",    SpicyLevel = 1, Description = "Tandoori chicken in creamy tomato sauce.",                ImageUrl = "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80" },
                new MenuItem { Id =  5, Name = "Lamb Rogan Josh",   SpicyLevel = 3, Description = "Slow-cooked lamb in Kashmiri spices.",                    ImageUrl = "https://images.unsplash.com/photo-1545247181-516773cae754?auto=format&fit=crop&w=800&q=80" },
                new MenuItem { Id =  6, Name = "Palak Paneer",      SpicyLevel = 1, Description = "Cottage cheese in silky spinach gravy.",                  ImageUrl = "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80" },
                new MenuItem { Id =  7, Name = "Chicken Biryani",   SpicyLevel = 2, Description = "Fragrant basmati rice with chicken and saffron.",         ImageUrl = "https://images.unsplash.com/photo-1633945274309-2c16c9682a8d?auto=format&fit=crop&w=800&q=80" },
                new MenuItem { Id =  8, Name = "Vegetable Biryani", SpicyLevel = 1, Description = "Aromatic rice with garden vegetables.",                    ImageUrl = "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80" },
                new MenuItem { Id =  9, Name = "Garlic Naan",       SpicyLevel = 0, Description = "Soft tandoor bread brushed with garlic butter.",          ImageUrl = "https://images.unsplash.com/photo-1626776876729-bab4369a5a5a?auto=format&fit=crop&w=800&q=80" },
                new MenuItem { Id = 10, Name = "Butter Naan",       SpicyLevel = 0, Description = "Classic tandoor naan with melted butter.",                ImageUrl = "https://images.unsplash.com/photo-1633237308525-cd587cf71926?auto=format&fit=crop&w=800&q=80" },
                new MenuItem { Id = 11, Name = "Gulab Jamun",       SpicyLevel = 0, Description = "Warm milk dumplings in rose syrup.",                      ImageUrl = "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80" },
                new MenuItem { Id = 12, Name = "Mango Lassi",       SpicyLevel = 0, Description = "Creamy yoghurt drink with Alphonso mango.",               ImageUrl = "https://images.unsplash.com/photo-1626200419199-391ae4be7a41?auto=format&fit=crop&w=800&q=80" },
                new MenuItem { Id = 13, Name = "Masala Chai",       SpicyLevel = 0, Description = "Spiced black tea with milk.",                             ImageUrl = "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80" }
            );
            await context.SaveChangesAsync();
            await context.Database.ExecuteSqlRawAsync("SET IDENTITY_INSERT [MenuItems] OFF");

            // 4. Menu → item mappings (composite PK — no IDENTITY_INSERT needed)
            await context.MenuItemsMappings.AddRangeAsync(
                new MenuItemsMapping { MenuId = 1, MenuItemId = 1 },
                new MenuItemsMapping { MenuId = 1, MenuItemId = 2 },
                new MenuItemsMapping { MenuId = 1, MenuItemId = 3 },
                new MenuItemsMapping { MenuId = 2, MenuItemId = 4 },
                new MenuItemsMapping { MenuId = 2, MenuItemId = 5 },
                new MenuItemsMapping { MenuId = 2, MenuItemId = 6 },
                new MenuItemsMapping { MenuId = 3, MenuItemId = 7 },
                new MenuItemsMapping { MenuId = 3, MenuItemId = 8 },
                new MenuItemsMapping { MenuId = 4, MenuItemId = 9  },
                new MenuItemsMapping { MenuId = 4, MenuItemId = 10 },
                new MenuItemsMapping { MenuId = 5, MenuItemId = 11 },
                new MenuItemsMapping { MenuId = 6, MenuItemId = 12 },
                new MenuItemsMapping { MenuId = 6, MenuItemId = 13 }
            );
            await context.SaveChangesAsync();

            // 5. Dietary labels (composite PK — no IDENTITY_INSERT needed)
            var vegIds    = new long[] { 1, 2, 6, 8, 9, 10, 11, 12, 13 };
            var nonVegIds = new long[] { 3, 4, 5, 7 };
            await context.MenuItemLabels.AddRangeAsync(
                vegIds.Select(id => new MenuItemLabel { MenuItemId = id, LabelId = 1 })
                      .Concat(nonVegIds.Select(id => new MenuItemLabel { MenuItemId = id, LabelId = 2 }))
            );
            await context.SaveChangesAsync();

            // 6. Branches ──────────────────────────────────────────────────────
            await context.Database.ExecuteSqlRawAsync("SET IDENTITY_INSERT [Branches] ON");
            await context.Branches.AddRangeAsync(
                new Branch
                {
                    Id = 1, Name = "Hind Indisk Aarhus",
                    AddressLine1 = "Frederiksgade 72", City = "Aarhus", PostalCode = "8000", Country = "Denmark",
                    WeekdayOpenTime = new TimeOnly(12, 0), WeekdayCloseTime = new TimeOnly(22, 0),
                    WeekendOpenTime = new TimeOnly(12, 0), WeekendCloseTime = new TimeOnly(22, 0),
                    Phone = "+45 86 12 34 56", Email = "aarhus@hindindisk.dk",
                    GoogleMapsLink = "https://maps.google.com/?q=Frederiksgade+72+Aarhus",
                    GooglePlaceId = "", GoogleBusinessProfileLink = "",
                },
                new Branch
                {
                    Id = 2, Name = "Hind Indisk Copenhagen",
                    AddressLine1 = "Vesterbrogade 41", City = "Copenhagen", PostalCode = "1620", Country = "Denmark",
                    WeekdayOpenTime = new TimeOnly(11, 30), WeekdayCloseTime = new TimeOnly(23, 0),
                    WeekendOpenTime = new TimeOnly(11, 30), WeekendCloseTime = new TimeOnly(23, 0),
                    Phone = "+45 33 22 11 88", Email = "copenhagen@hindindisk.dk",
                    GoogleMapsLink = "https://maps.google.com/?q=Vesterbrogade+41+Copenhagen",
                    GooglePlaceId = "", GoogleBusinessProfileLink = "",
                }
            );
            await context.SaveChangesAsync();
            await context.Database.ExecuteSqlRawAsync("SET IDENTITY_INSERT [Branches] OFF");

            // 7. Branch ↔ menu links (composite PK — no IDENTITY_INSERT needed)
            var branchMenus = new List<BranchMenu>();
            foreach (var branchId in new long[] { 1, 2 })
                for (var menuId = 1L; menuId <= 6; menuId++)
                    branchMenus.Add(new BranchMenu { BranchId = branchId, MenuId = menuId });
            await context.BranchMenus.AddRangeAsync(branchMenus);
            await context.SaveChangesAsync();

            // 8. Per-branch item prices (composite PK — no IDENTITY_INSERT needed)
            var prices = new Dictionary<long, decimal>
            {
                [1]  = 49,  [2]  = 119, [3]  = 99,  [4]  = 149, [5]  = 169,
                [6]  = 139, [7]  = 139, [8]  = 119, [9]  = 39,  [10] = 35,
                [11] = 59,  [12] = 49,  [13] = 35,
            };
            var branchPrices = new List<BranchMenuItemPrice>();
            foreach (var branchId in new long[] { 1, 2 })
                foreach (var (itemId, price) in prices)
                    branchPrices.Add(new BranchMenuItemPrice { BranchId = branchId, MenuItemId = itemId, Price = price });
            await context.BranchMenuItemPrices.AddRangeAsync(branchPrices);
            await context.SaveChangesAsync();

            // 9. Offers ────────────────────────────────────────────────────────
            await context.Database.ExecuteSqlRawAsync("SET IDENTITY_INSERT [Offers] ON");
            var now = DateTime.UtcNow;
            await context.Offers.AddRangeAsync(
                new Offer
                {
                    Id = 1, Title = "Welcome Discount", Description = "10% off on your first order.",
                    OfferType = "Coupon", DiscountType = "Percent", DiscountValue = 10,
                    CouponCode = "WELCOME10", IsAutoApply = false,
                    StartDate = now, EndDate = now.AddYears(2), IsActive = true,
                },
                new Offer
                {
                    Id = 2, Title = "Family Dinner", Description = "20% off for the whole family.",
                    OfferType = "Coupon", DiscountType = "Percent", DiscountValue = 20,
                    CouponCode = "FAMILY20", IsAutoApply = false,
                    StartDate = now, EndDate = now.AddYears(2), IsActive = true,
                },
                new Offer
                {
                    Id = 3, Title = "Free Delivery", Description = "Waives the 39 DKK delivery fee.",
                    OfferType = "Coupon", DiscountType = "FreeShipping", DiscountValue = 0,
                    CouponCode = "FREEDELIVERY", IsAutoApply = false,
                    StartDate = now, EndDate = now.AddYears(2), IsActive = true,
                }
            );
            await context.SaveChangesAsync();
            await context.Database.ExecuteSqlRawAsync("SET IDENTITY_INSERT [Offers] OFF");
        }
        finally
        {
            await context.Database.CloseConnectionAsync();
        }
    }
}
