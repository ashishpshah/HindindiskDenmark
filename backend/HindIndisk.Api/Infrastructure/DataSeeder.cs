using HindIndisk.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace HindIndisk.Api.Infrastructure;

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
            finally { await context.Database.CloseConnectionAsync(); }
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
                new Menu { Id =  1, Name = "Fry Corner",              Description = "Forretter",                                                  IsActive = true },
                new Menu { Id =  2, Name = "Grill & Sizzler Corner",  Description = "Grill & Sizzler Corner",                                    IsActive = true },
                new Menu { Id =  3, Name = "Chicken Corner",          Description = "Chicken Corner (alle karryretter serveres med ris)",         IsActive = true },
                new Menu { Id =  4, Name = "Lamb Corner",             Description = "Lam Corner (alle karryretter serveres med ris)",             IsActive = true },
                new Menu { Id =  5, Name = "Veg and Vegan Corner",    Description = "Veg og Vegan Corner (alle karryretter serveres med ris)",    IsActive = true },
                new Menu { Id =  6, Name = "Rice and Biryani Corner", Description = "Ris og Biryani hjørne",                                     IsActive = true },
                new Menu { Id =  7, Name = "Naan Bread",              Description = "Naan Brød",                                                 IsActive = true },
                new Menu { Id =  8, Name = "Kiddi Menu & Desserts",   Description = "Kiddi Menu og komplimenter og desserter",                   IsActive = true },
                new Menu { Id =  9, Name = "Drinks",                  Description = "Drikkevarer",                                               IsActive = true },
                new Menu { Id = 10, Name = "Beer and Wines",          Description = "Øl og vin",                                                 IsActive = true }
            );
            await context.SaveChangesAsync();
            await context.Database.ExecuteSqlRawAsync("SET IDENTITY_INSERT [Menus] OFF");

            // 3. Menu Items ────────────────────────────────────────────────────
            await context.Database.ExecuteSqlRawAsync("SET IDENTITY_INSERT [MenuItems] ON");
            await context.MenuItems.AddRangeAsync(
                // ── Fry Corner ──────────────────────────────────────────────
                new MenuItem { Id =  1, Name = "Papadam (2 stk)",                   SpicyLevel = 0, Description = "Lightly spiced oversize chips of chickpea flour, served with mango chutney and mint chutney" },
                new MenuItem { Id =  2, Name = "French Fries",                       SpicyLevel = 0, Description = "French fries - soft on the inside, golden and crispy on the outside, served with ketchup" },
                new MenuItem { Id =  3, Name = "Chilli Milli Prawns (6 pieces)",    SpicyLevel = 2, Description = "Deep fried king prawns breaded in spicy dough. Served with traditional gravy and mint chutney" },
                new MenuItem { Id =  4, Name = "Tandoori Chicken Sheekh Kebab (3 stk)", SpicyLevel = 1, Description = "Spear with minced chicken mixed with herbs and spices, cooked in tandoor and served with Hind grill salad" },
                new MenuItem { Id =  5, Name = "Vegetable Samosa (2 stk.)",          SpicyLevel = 1, Description = "Vegetarian samosa with mild spices. Served with mint chutney, ketchup and Hind salat" },
                new MenuItem { Id =  6, Name = "Chicken Samosa (2 stk.)",            SpicyLevel = 1, Description = "Chicken samosa with mild spices. Served with mint chutney, ketchup and Hind salat" },
                new MenuItem { Id =  7, Name = "Onion Bhaji (5 stk)",               SpicyLevel = 1, Description = "Crispy onion rings fried in spicy dough. Served with mint chutney, ketchup and Hind salat" },
                new MenuItem { Id =  8, Name = "Chicken Rolls (4 stk.)",             SpicyLevel = 1, Description = "Spring rolls with chicken. Served with mint chutney, ketchup and Hind salat" },
                new MenuItem { Id = 10, Name = "Chicken Pakora (5 stk)",             SpicyLevel = 1, Description = "Deep-fried chicken pieces breaded in mild spicy dough, served with mint chutney, ketchup and Hind salad" },
                // ── Grill & Sizzler ──────────────────────────────────────────
                new MenuItem { Id = 11, Name = "Chicken Tandoori Leg (3 pcs)",       SpicyLevel = 1, Description = "Tandoor grilled marinated chicken leg pieces, served with Hind grill salad and mint chutney" },
                new MenuItem { Id = 12, Name = "Tandoori Lam Tikka (8 stk)",         SpicyLevel = 1, Description = "Tandoor grilled pieces of marinated lamb, served with Hind grill salad and mint chutney" },
                new MenuItem { Id = 14, Name = "Tandoori King Prawns (8 stk)",       SpicyLevel = 1, Description = "Tandoor grilled pieces of marinated prawns, served with Hind grill salad and mint chutney" },
                new MenuItem { Id = 16, Name = "Grilled Paneer & Bengan",            SpicyLevel = 0, Description = "Tandoor grilled pieces of marinated paneer and aubergine, served with Hind grill salad and mint chutney" },
                new MenuItem { Id = 17, Name = "Chicken Tikka (7 pieces)",           SpicyLevel = 1, Description = "Tandoor grilled pieces of marinated chicken, served with Hind grill salad and mint chutney" },
                new MenuItem { Id = 18, Name = "Tandoori Lamb Sheekh Kebab (3 stk)", SpicyLevel = 1, Description = "Minced lamb cooked with spices and herbs in tandoor. Served with Hind grill salad and mint chutney" },
                // ── Chicken Corner ───────────────────────────────────────────
                new MenuItem { Id = 19, Name = "Hind Butter Chicken",                SpicyLevel = 1, Description = "Grilled chicken cooked with curry sauce with butter, cream, almonds, cashews and fresh herbs" },
                new MenuItem { Id = 20, Name = "Chicken Spinach",                    SpicyLevel = 1, Description = "Chicken pieces and spinach cooked with onions, tomatoes and traditional spices" },
                new MenuItem { Id = 21, Name = "Chicken Tikka Masala",               SpicyLevel = 2, Description = "Grilled chicken pieces cooked in curry sauce with cashews, fresh tomatoes, onions, peppers and cream" },
                new MenuItem { Id = 22, Name = "Chicken Korma",                      SpicyLevel = 1, Description = "Chicken cooked with spices in tasty coconut sauce" },
                new MenuItem { Id = 23, Name = "Chicken Hyderabadi (Spicy)",         SpicyLevel = 3, Description = "Strong and hot spicy curry sauce with chicken pieces, special spices, onions, tomatoes and fresh peppers" },
                new MenuItem { Id = 24, Name = "Chicken Madras (Extra Spicy)",       SpicyLevel = 3, Description = "Strong spicy madras curry sauce with chicken pieces, tomatoes, onions and fresh peppers" },
                new MenuItem { Id = 25, Name = "Chicken Karahi (Wok)",               SpicyLevel = 2, Description = "Chicken pieces prepared with onions, tomato sauce and traditional spices" },
                new MenuItem { Id = 26, Name = "Chicken Vindaloo (Spicy)",           SpicyLevel = 3, Description = "Strong and hot spicy curry sauce with chicken pieces, special spices, onions, tomatoes, potatoes and fresh peppers" },
                // ── Lamb Corner ──────────────────────────────────────────────
                new MenuItem { Id = 27, Name = "Lamb Korma",                         SpicyLevel = 1, Description = "Lamb pieces cooked with spices in tasty coconut sauce" },
                new MenuItem { Id = 28, Name = "Lamb Tikka Masala",                  SpicyLevel = 2, Description = "Grilled lamb pieces cooked in curry sauce with cashews, fresh tomatoes, onions, peppers and cream" },
                new MenuItem { Id = 29, Name = "Lamb Kadai",                         SpicyLevel = 2, Description = "Lamb pieces prepared with onions, tomato sauce and traditional spices" },
                new MenuItem { Id = 30, Name = "Lamb Hyderabadi",                    SpicyLevel = 3, Description = "Strong and hot spicy curry sauce with lamb pieces, special spices, onions, tomatoes and fresh peppers" },
                new MenuItem { Id = 31, Name = "Lamb Butter Curry",                  SpicyLevel = 1, Description = "Grilled lamb pieces cooked with curry sauce with butter, cream, almonds, cashews and fresh herbs" },
                new MenuItem { Id = 32, Name = "Lamb Vindaloo (Spicy)",              SpicyLevel = 3, Description = "Strong and hot spicy curry sauce with lamb pieces, special spices, onions, tomatoes, potatoes and fresh peppers" },
                new MenuItem { Id = 33, Name = "Lamb Madras (Extra Spicy)",          SpicyLevel = 3, Description = "Strong spicy madras curry sauce with lamb pieces, tomatoes, onions and fresh peppers" },
                new MenuItem { Id = 34, Name = "Lamb Spinach",                       SpicyLevel = 1, Description = "Lamb pieces and spinach cooked with onions, tomatoes and traditional spices" },
                // ── Veg & Vegan Corner ───────────────────────────────────────
                new MenuItem { Id = 35, Name = "Mix Vegetable",                      SpicyLevel = 2, Description = "Mixed vegetables in season prepared with onions and tomatoes in a spicy sauce" },
                new MenuItem { Id = 36, Name = "Paneer Masala Rajasthani",           SpicyLevel = 2, Description = "Paneer cheese cooked with medium spicy butter sauce and special spices" },
                new MenuItem { Id = 37, Name = "Paneer Spinach",                     SpicyLevel = 1, Description = "Paneer cheese and spinach cooked with butter and special spices" },
                new MenuItem { Id = 38, Name = "Punjabi Chana Masala",               SpicyLevel = 1, Description = "Chickpeas cooked with pepper, garlic, ginger and special spices" },
                new MenuItem { Id = 39, Name = "Punjabi Daal Tadka",                 SpicyLevel = 1, Description = "Yellow lentils prepared with onions and traditional spices" },
                new MenuItem { Id = 40, Name = "Aloo Palak",                         SpicyLevel = 1, Description = "Potatoes and spinach cooked with garlic, ginger and special spices" },
                new MenuItem { Id = 41, Name = "Aloo Zeera",                         SpicyLevel = 0, Description = "Potatoes and cumin seeds cooked with garlic, ginger and special spices" },
                new MenuItem { Id = 42, Name = "King Butter Curry (Prawns)",         SpicyLevel = 1, Description = "Grilled king prawns in butter curry sauce prepared with cream, almonds, raisins, cashews and fresh herbs" },
                // ── Rice & Biryani ───────────────────────────────────────────
                new MenuItem { Id = 43, Name = "Vegetable Bombay Biryani",           SpicyLevel = 1, Description = "Mixed fresh vegetables cooked with rice, curry and aromatic spices with saffron" },
                new MenuItem { Id = 44, Name = "Plain Rice",                         SpicyLevel = 0, Description = "Basmati rice steamed in lightly salted water" },
                new MenuItem { Id = 45, Name = "Pilau Rice",                         SpicyLevel = 0, Description = "Basmati rice steamed in onions with fragrant spices" },
                new MenuItem { Id = 46, Name = "Egg Rice",                           SpicyLevel = 0, Description = "Basmati rice steamed in eggs, onions with fragrant spices" },
                // ── Naan Bread ───────────────────────────────────────────────
                new MenuItem { Id = 47, Name = "Plain Naan",                         SpicyLevel = 0, Description = "Golden brown fluffy naan bread baked in tandoor" },
                new MenuItem { Id = 48, Name = "Garlic Naan",                        SpicyLevel = 0, Description = "Golden brown fluffy naan bread baked in tandoor smeared with garlic paste" },
                new MenuItem { Id = 49, Name = "Tandoori Roti",                      SpicyLevel = 0, Description = "Homemade flatbread baked in tandoor" },
                new MenuItem { Id = 50, Name = "Cheese Naan",                        SpicyLevel = 0, Description = "Golden brown fluffy naan bread baked in tandoor smeared with cheese" },
                // ── Kiddi Menu & Desserts ────────────────────────────────────
                new MenuItem { Id = 51, Name = "Children Menu",                      SpicyLevel = 0, Description = "French fries with 6 pcs. chicken nuggets and ketchup" },
                new MenuItem { Id = 52, Name = "Hind Raita",                         SpicyLevel = 0, Description = "Finely chopped salad mixed with neutral yogurt and light spices" },
                new MenuItem { Id = 53, Name = "Hind Special Salat",                 SpicyLevel = 0, Description = "Seasonal fresh vegetables, cashews, almonds, raisins, olives, feta cheese and dressing" },
                new MenuItem { Id = 54, Name = "Risalamande",                        SpicyLevel = 0, Description = "Rice porridge, cream and vanilla with sweet and sour cherry sauce on top" },
                new MenuItem { Id = 55, Name = "Gulab Jaman",                        SpicyLevel = 0, Description = "Dough balls fried in syrup" },
                new MenuItem { Id = 56, Name = "Dips",                               SpicyLevel = 1, Description = "Dips consisting of mango chutney, pickles, mint dip and chilli" },
                // ── Drinks ───────────────────────────────────────────────────
                new MenuItem { Id = 57, Name = "Coca-Cola 0.5L",                     SpicyLevel = 0, Description = "Coca-Cola 0.5L" },
                new MenuItem { Id = 58, Name = "Coca-Cola Zero 0.5L",                SpicyLevel = 0, Description = "Coca-Cola Zero 0.5L" },
                new MenuItem { Id = 59, Name = "Sprite 0.5L",                        SpicyLevel = 0, Description = "Sprite 0.5L" },
                new MenuItem { Id = 60, Name = "Fanta 0.5L",                         SpicyLevel = 0, Description = "Fanta 0.5L" },
                new MenuItem { Id = 61, Name = "Spring Water 0.5L",                  SpicyLevel = 0, Description = "Still spring water 0.5L" },
                new MenuItem { Id = 62, Name = "Sparkling Water 0.5L",               SpicyLevel = 0, Description = "Spring water with soda 0.5L" },
                new MenuItem { Id = 63, Name = "Mango Lassi",                        SpicyLevel = 0, Description = "Creamy mango yoghurt drink" },
                new MenuItem { Id = 64, Name = "Fresh Lassi",                        SpicyLevel = 0, Description = "Fresh plain yoghurt drink" },
                // ── Beer & Wines ─────────────────────────────────────────────
                new MenuItem { Id = 65, Name = "Kingfisher 0.33 cl",                 SpicyLevel = 0, Description = "Kingfisher Indian lager 0.33 cl" },
                new MenuItem { Id = 66, Name = "Cobra 0.33 cl",                      SpicyLevel = 0, Description = "Cobra Indian lager 0.33 cl" },
                new MenuItem { Id = 67, Name = "Tuborg Jule Beer 0.33 cl",           SpicyLevel = 0, Description = "Tuborg Christmas beer 0.33 cl" },
                new MenuItem { Id = 68, Name = "Salentein Red Wine",                 SpicyLevel = 0, Description = "Salentein Malbec red wine" },
                new MenuItem { Id = 69, Name = "Red Wine House (2)",                 SpicyLevel = 0, Description = "House red wine selection 2" },
                new MenuItem { Id = 70, Name = "Red Wine House (3)",                 SpicyLevel = 0, Description = "House red wine selection 3" },
                new MenuItem { Id = 71, Name = "Salentein White Wine",               SpicyLevel = 0, Description = "Salentein Chardonnay white wine" },
                new MenuItem { Id = 72, Name = "White Wine House (2)",               SpicyLevel = 0, Description = "House white wine selection 2" }
            );
            await context.SaveChangesAsync();
            await context.Database.ExecuteSqlRawAsync("SET IDENTITY_INSERT [MenuItems] OFF");

            // 4. Menu → item mappings  (items 9, 13, 15 absent from source data)
            await context.MenuItemsMappings.AddRangeAsync(
                // Menu 1: Fry Corner
                new MenuItemsMapping { MenuId = 1, MenuItemId =  1 }, new MenuItemsMapping { MenuId = 1, MenuItemId =  2 },
                new MenuItemsMapping { MenuId = 1, MenuItemId =  3 }, new MenuItemsMapping { MenuId = 1, MenuItemId =  4 },
                new MenuItemsMapping { MenuId = 1, MenuItemId =  5 }, new MenuItemsMapping { MenuId = 1, MenuItemId =  6 },
                new MenuItemsMapping { MenuId = 1, MenuItemId =  7 }, new MenuItemsMapping { MenuId = 1, MenuItemId =  8 },
                new MenuItemsMapping { MenuId = 1, MenuItemId = 10 },
                // Menu 2: Grill & Sizzler
                new MenuItemsMapping { MenuId = 2, MenuItemId = 11 }, new MenuItemsMapping { MenuId = 2, MenuItemId = 12 },
                new MenuItemsMapping { MenuId = 2, MenuItemId = 14 }, new MenuItemsMapping { MenuId = 2, MenuItemId = 16 },
                new MenuItemsMapping { MenuId = 2, MenuItemId = 17 }, new MenuItemsMapping { MenuId = 2, MenuItemId = 18 },
                // Menu 3: Chicken Corner
                new MenuItemsMapping { MenuId = 3, MenuItemId = 19 }, new MenuItemsMapping { MenuId = 3, MenuItemId = 20 },
                new MenuItemsMapping { MenuId = 3, MenuItemId = 21 }, new MenuItemsMapping { MenuId = 3, MenuItemId = 22 },
                new MenuItemsMapping { MenuId = 3, MenuItemId = 23 }, new MenuItemsMapping { MenuId = 3, MenuItemId = 24 },
                new MenuItemsMapping { MenuId = 3, MenuItemId = 25 }, new MenuItemsMapping { MenuId = 3, MenuItemId = 26 },
                // Menu 4: Lamb Corner
                new MenuItemsMapping { MenuId = 4, MenuItemId = 27 }, new MenuItemsMapping { MenuId = 4, MenuItemId = 28 },
                new MenuItemsMapping { MenuId = 4, MenuItemId = 29 }, new MenuItemsMapping { MenuId = 4, MenuItemId = 30 },
                new MenuItemsMapping { MenuId = 4, MenuItemId = 31 }, new MenuItemsMapping { MenuId = 4, MenuItemId = 32 },
                new MenuItemsMapping { MenuId = 4, MenuItemId = 33 }, new MenuItemsMapping { MenuId = 4, MenuItemId = 34 },
                // Menu 5: Veg & Vegan
                new MenuItemsMapping { MenuId = 5, MenuItemId = 35 }, new MenuItemsMapping { MenuId = 5, MenuItemId = 36 },
                new MenuItemsMapping { MenuId = 5, MenuItemId = 37 }, new MenuItemsMapping { MenuId = 5, MenuItemId = 38 },
                new MenuItemsMapping { MenuId = 5, MenuItemId = 39 }, new MenuItemsMapping { MenuId = 5, MenuItemId = 40 },
                new MenuItemsMapping { MenuId = 5, MenuItemId = 41 }, new MenuItemsMapping { MenuId = 5, MenuItemId = 42 },
                // Menu 6: Rice & Biryani
                new MenuItemsMapping { MenuId = 6, MenuItemId = 43 }, new MenuItemsMapping { MenuId = 6, MenuItemId = 44 },
                new MenuItemsMapping { MenuId = 6, MenuItemId = 45 }, new MenuItemsMapping { MenuId = 6, MenuItemId = 46 },
                // Menu 7: Naan Bread
                new MenuItemsMapping { MenuId = 7, MenuItemId = 47 }, new MenuItemsMapping { MenuId = 7, MenuItemId = 48 },
                new MenuItemsMapping { MenuId = 7, MenuItemId = 49 }, new MenuItemsMapping { MenuId = 7, MenuItemId = 50 },
                // Menu 8: Kiddi Menu & Desserts
                new MenuItemsMapping { MenuId = 8, MenuItemId = 51 }, new MenuItemsMapping { MenuId = 8, MenuItemId = 52 },
                new MenuItemsMapping { MenuId = 8, MenuItemId = 53 }, new MenuItemsMapping { MenuId = 8, MenuItemId = 54 },
                new MenuItemsMapping { MenuId = 8, MenuItemId = 55 }, new MenuItemsMapping { MenuId = 8, MenuItemId = 56 },
                // Menu 9: Drinks
                new MenuItemsMapping { MenuId = 9, MenuItemId = 57 }, new MenuItemsMapping { MenuId = 9, MenuItemId = 58 },
                new MenuItemsMapping { MenuId = 9, MenuItemId = 59 }, new MenuItemsMapping { MenuId = 9, MenuItemId = 60 },
                new MenuItemsMapping { MenuId = 9, MenuItemId = 61 }, new MenuItemsMapping { MenuId = 9, MenuItemId = 62 },
                new MenuItemsMapping { MenuId = 9, MenuItemId = 63 }, new MenuItemsMapping { MenuId = 9, MenuItemId = 64 },
                // Menu 10: Beer & Wines
                new MenuItemsMapping { MenuId = 10, MenuItemId = 65 }, new MenuItemsMapping { MenuId = 10, MenuItemId = 66 },
                new MenuItemsMapping { MenuId = 10, MenuItemId = 67 }, new MenuItemsMapping { MenuId = 10, MenuItemId = 68 },
                new MenuItemsMapping { MenuId = 10, MenuItemId = 69 }, new MenuItemsMapping { MenuId = 10, MenuItemId = 70 },
                new MenuItemsMapping { MenuId = 10, MenuItemId = 71 }, new MenuItemsMapping { MenuId = 10, MenuItemId = 72 }
            );
            await context.SaveChangesAsync();

            // 5. Branches ──────────────────────────────────────────────────────
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

            // 6. Branch ↔ menu links (both branches, all 10 menus) ────────────
            var branchMenus = new List<BranchMenu>();
            foreach (var branchId in new long[] { 1, 2 })
                for (var menuId = 1L; menuId <= 10; menuId++)
                    branchMenus.Add(new BranchMenu { BranchId = branchId, MenuId = menuId });
            await context.BranchMenus.AddRangeAsync(branchMenus);
            await context.SaveChangesAsync();

            // 7. Per-branch item prices (same price for both branches) ─────────
            var prices = new Dictionary<long, decimal>
            {
                // Fry Corner
                [ 1] =  39, [ 2] =  49, [ 3] = 119, [ 4] =  89, [ 5] =  49,
                [ 6] =  59, [ 7] =  49, [ 8] =  49, [10] =  59,
                // Grill & Sizzler
                [11] = 139, [12] = 149, [14] = 149, [16] = 139, [17] = 139, [18] = 109,
                // Chicken Corner
                [19] = 139, [20] = 139, [21] = 139, [22] = 139,
                [23] = 139, [24] = 139, [25] = 139, [26] = 139,
                // Lamb Corner
                [27] = 149, [28] = 149, [29] = 149, [30] = 149,
                [31] = 149, [32] = 149, [33] = 149, [34] = 149,
                // Veg & Vegan
                [35] = 129, [36] = 139, [37] = 139, [38] = 129,
                [39] = 129, [40] = 129, [41] = 129, [42] = 149,
                // Rice & Biryani
                [43] = 129, [44] =  25, [45] =  39, [46] =  49,
                // Naan Bread
                [47] =  25, [48] =  30, [49] =  25, [50] =  35,
                // Kiddi Menu & Desserts
                [51] =  69, [52] =  39, [53] =  49, [54] =  30, [55] =  35, [56] =  39,
                // Drinks
                [57] =  25, [58] =  25, [59] =  25, [60] =  25, [61] =  25, [62] =  25,
                [63] =  35, [64] =  30,
                // Beer & Wines
                [65] =  45, [66] =  45, [67] =  20,
                [68] = 159, [69] = 159, [70] = 159, [71] = 159, [72] = 159,
            };
            var branchPrices = new List<BranchMenuItemPrice>();
            foreach (var branchId in new long[] { 1, 2 })
                foreach (var (itemId, price) in prices)
                    branchPrices.Add(new BranchMenuItemPrice { BranchId = branchId, MenuItemId = itemId, Price = price });
            await context.BranchMenuItemPrices.AddRangeAsync(branchPrices);
            await context.SaveChangesAsync();

            // 8. Offers ────────────────────────────────────────────────────────
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
