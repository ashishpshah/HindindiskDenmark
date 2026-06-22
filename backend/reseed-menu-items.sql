-- ============================================================
-- Hind Indisk — Menu / Item reset script
-- Run once in SSMS against [dbHindInDisk].
-- Clears all menu-item data and inserts new catalogue.
-- Orders are also deleted so FK constraints are satisfied.
-- ============================================================

USE [dbHindInDisk];
GO

BEGIN TRANSACTION;

-- 1. Clear dependent tables (leaf → root order)
DELETE FROM [OfferMenuItems];
DELETE FROM [OrderItems];
DELETE FROM [Orders];
DELETE FROM [MenuItemLabels];
DELETE FROM [MenuItemsMappings];
DELETE FROM [BranchMenuItemPrices];
DELETE FROM [BranchMenus];
DELETE FROM [MenuItems];
DELETE FROM [Menus];

DBCC CHECKIDENT ('[MenuItems]', RESEED, 0);
DBCC CHECKIDENT ('[Menus]',     RESEED, 0);
DBCC CHECKIDENT ('[Orders]',    RESEED, 0);

-- ============================================================
-- 2. Menus (10 categories)
-- ============================================================
SET IDENTITY_INSERT [Menus] ON;

INSERT INTO [Menus] (Id, Name, Description, IsActive) VALUES
( 1, N'Fry Corner',              N'Forretter',                                                    1),
( 2, N'Grill & Sizzler Corner',  N'Grill & Sizzler Corner',                                       1),
( 3, N'Chicken Corner',          N'Chicken Corner (alle karryretter serveres med ris)',            1),
( 4, N'Lamb Corner',             N'Lam Corner (alle karryretter serveres med ris)',                1),
( 5, N'Veg and Vegan Corner',    N'Veg og Vegan Corner (alle karryretter serveres med ris)',       1),
( 6, N'Rice and Biryani Corner', N'Ris og Biryani hjørne',                                        1),
( 7, N'Naan Bread',              N'Naan Brød',                                                    1),
( 8, N'Kiddi Menu & Desserts',   N'Kiddi Menu og komplimenter og desserter',                      1),
( 9, N'Drinks',                  N'Drikkevarer',                                                  1),
(10, N'Beer and Wines',          N'Øl og vin',                                                    1);

SET IDENTITY_INSERT [Menus] OFF;

-- ============================================================
-- 3. Menu Items  (SpicyLevel: 0=none 1=mild 2=medium 3=hot)
-- ============================================================
SET IDENTITY_INSERT [MenuItems] ON;

INSERT INTO [MenuItems] (Id, Name, Description, ImageUrl, SpicyLevel) VALUES
-- Fry Corner
( 1, N'Papadam (2 stk)',                  N'Lightly spiced oversize chips of chickpea flour, served with mango chutney and mint chutney', N'', 0),
( 2, N'French Fries',                     N'French fries - soft on the inside, golden and crispy on the outside served with ketchup', N'', 0),
( 3, N'Chilli Milli Prawns (6 pieces)',   N'Deep fried king prawns breaded in spicy dough. Served with traditional gravy and mint chutney', N'', 2),
( 4, N'Tandoori Chicken Sheekh Kebab (3 stk)', N'Spear with minced chicken mixed with herbs and spices, cooked in tandoor and served with Hind grill salad', N'', 1),
( 5, N'Vegetable Samosa (2 stk.)',        N'Vegetarian samosa with mild spices. Served with mint chutney, ketchup and Hind salat', N'', 1),
( 6, N'Chicken Samosa (2 stk.)',          N'Chicken samosa with mild spices. Served with mint chutney, ketchup and Hind salat', N'', 1),
( 7, N'Onion Bhaji (5 stk)',              N'Crispy onion rings fried in spicy dough. Served with mint chutney, ketchup and Hind salat', N'', 1),
( 8, N'Chicken Rolls (4 stk.)',           N'Spring rolls with chicken. Served with mint chutney, ketchup and Hind salat', N'', 1),
(10, N'Chicken Pakora (5 stk)',           N'Deep-fried chicken pieces breaded in mild spicy dough, served with mint chutney, ketchup and Hind salad', N'', 1),
-- Grill & Sizzler
(11, N'Chicken Tandoori Leg (3 pcs)',     N'Tandoor grilled marinated chicken leg pieces, served with Hind grill salad and mint chutney', N'', 1),
(12, N'Tandoori Lam Tikka (8 stk)',       N'Tandoor grilled pieces of marinated lamb, served with Hind grill salad and mint chutney', N'', 1),
(14, N'Tandoori King Prawns (8 stk)',     N'Tandoor grilled pieces of marinated prawns, served with Hind grill salad and mint chutney', N'', 1),
(16, N'Grilled Paneer & Bengan',          N'Tandoor grilled pieces of marinated paneer and aubergine, served with Hind grill salad and mint chutney', N'', 0),
(17, N'Chicken Tikka (7 pieces)',         N'Tandoor grilled pieces of marinated chicken, served with Hind grill salad and mint chutney', N'', 1),
(18, N'Tandoori Lamb Sheekh Kebab (3 stk)', N'Minced lamb cooked with spices and herbs in tandoor. Served with Hind grill salad and mint chutney', N'', 1),
-- Chicken Corner
(19, N'Hind Butter Chicken',              N'Grilled chicken cooked with curry sauce with butter, cream, almonds, cashews and fresh herbs', N'', 1),
(20, N'Chicken Spinach',                  N'Chicken pieces and spinach cooked with onions, tomatoes and traditional spices', N'', 1),
(21, N'Chicken Tikka Masala',             N'Grilled chicken pieces cooked in curry sauce with cashews, fresh tomatoes, onions, peppers and cream', N'', 2),
(22, N'Chicken Korma',                    N'Chicken cooked with spices in tasty coconut sauce', N'', 1),
(23, N'Chicken Hyderabadi (Spicy)',        N'Strong and hot spicy curry sauce with chicken pieces, special spices, onions, tomatoes and fresh peppers', N'', 3),
(24, N'Chicken Madras (Extra Spicy)',      N'Strong spicy madras curry sauce with chicken pieces, tomatoes, onions and fresh peppers', N'', 3),
(25, N'Chicken Karahi (Wok)',             N'Chicken pieces prepared with onions, tomato sauce and traditional spices', N'', 2),
(26, N'Chicken Vindaloo (Spicy)',          N'Strong and hot spicy curry sauce with chicken pieces, special spices, onions, tomatoes, potatoes and fresh peppers', N'', 3),
-- Lamb Corner
(27, N'Lamb Korma',                       N'Lamb pieces cooked with spices in tasty coconut sauce', N'', 1),
(28, N'Lamb Tikka Masala',                N'Grilled lamb pieces cooked in curry sauce with cashews, fresh tomatoes, onions, peppers and cream', N'', 2),
(29, N'Lamb Kadai',                       N'Lamb pieces prepared with onions, tomato sauce and traditional spices', N'', 2),
(30, N'Lamb Hyderabadi',                  N'Strong and hot spicy curry sauce with lamb pieces, special spices, onions, tomatoes and fresh peppers', N'', 3),
(31, N'Lamb Butter Curry',                N'Grilled lamb pieces cooked with curry sauce with butter, cream, almonds, cashews and fresh herbs', N'', 1),
(32, N'Lamb Vindaloo (Spicy)',             N'Strong and hot spicy curry sauce with lamb pieces, special spices, onions, tomatoes, potatoes and fresh peppers', N'', 3),
(33, N'Lamb Madras (Extra Spicy)',         N'Strong spicy madras curry sauce with lamb pieces, tomatoes, onions and fresh peppers', N'', 3),
(34, N'Lamb Spinach',                     N'Lamb pieces and spinach cooked with onions, tomatoes and traditional spices', N'', 1),
-- Veg & Vegan Corner
(35, N'Mix Vegetable',                    N'Mixed vegetables in season prepared with onions and tomatoes in a spicy sauce', N'', 2),
(36, N'Paneer Masala Rajasthani',         N'Paneer cheese cooked with medium spicy butter sauce and special spices', N'', 2),
(37, N'Paneer Spinach',                   N'Paneer cheese and spinach cooked with butter and special spices', N'', 1),
(38, N'Punjabi Chana Masala',             N'Chickpeas cooked with pepper, garlic, ginger and special spices', N'', 1),
(39, N'Punjabi Daal Tadka',               N'Yellow lentils prepared with onions and traditional spices', N'', 1),
(40, N'Aloo Palak',                       N'Potatoes and spinach cooked with garlic, ginger and special spices', N'', 1),
(41, N'Aloo Zeera',                       N'Potatoes and cumin seeds cooked with garlic, ginger and special spices', N'', 0),
(42, N'King Butter Curry (Prawns)',        N'Grilled king prawns in butter curry sauce prepared with cream, almonds, raisins, cashews and fresh herbs', N'', 1),
-- Rice & Biryani
(43, N'Vegetable Bombay Biryani',         N'Mixed fresh vegetables cooked with rice, curry and aromatic spices with saffron', N'', 1),
(44, N'Plain Rice',                       N'Basmati rice steamed in lightly salted water', N'', 0),
(45, N'Pilau Rice',                       N'Basmati rice steamed in onions with fragrant spices', N'', 0),
(46, N'Egg Rice',                         N'Basmati rice steamed in eggs, onions with fragrant spices', N'', 0),
-- Naan Bread
(47, N'Plain Naan',                       N'Golden brown fluffy naan bread baked in tandoor', N'', 0),
(48, N'Garlic Naan',                      N'Golden brown fluffy naan bread baked in tandoor smeared with garlic paste', N'', 0),
(49, N'Tandoori Roti',                    N'Homemade flatbread baked in tandoor', N'', 0),
(50, N'Cheese Naan',                      N'Golden brown fluffy naan bread baked in tandoor smeared with cheese', N'', 0),
-- Kiddi Menu & Desserts
(51, N'Children Menu',                    N'French fries with 6 pcs. chicken nuggets and ketchup', N'', 0),
(52, N'Hind Raita',                       N'Finely chopped salad mixed with neutral yogurt and light spices', N'', 0),
(53, N'Hind Special Salat',               N'Seasonal fresh vegetables, cashews, almonds, raisins, olives, feta cheese and dressing', N'', 0),
(54, N'Risalamande',                      N'Rice porridge, cream and vanilla with sweet and sour cherry sauce on top', N'', 0),
(55, N'Gulab Jaman',                      N'Dough balls fried in syrup', N'', 0),
(56, N'Dips',                             N'Dips consisting of mango chutney, pickles, mint dip and chilli', N'', 1),
-- Drinks
(57, N'Coca-Cola 0.5L',                   N'Coca-Cola 0.5L', N'', 0),
(58, N'Coca-Cola Zero 0.5L',              N'Coca-Cola Zero 0.5L', N'', 0),
(59, N'Sprite 0.5L',                      N'Sprite 0.5L', N'', 0),
(60, N'Fanta 0.5L',                       N'Fanta 0.5L', N'', 0),
(61, N'Spring Water 0.5L',                N'Still spring water 0.5L', N'', 0),
(62, N'Sparkling Water 0.5L',             N'Spring water with soda 0.5L', N'', 0),
(63, N'Mango Lassi',                      N'Creamy mango yoghurt drink', N'', 0),
(64, N'Fresh Lassi',                      N'Fresh plain yoghurt drink', N'', 0),
-- Beer & Wines
(65, N'Kingfisher 0.33 cl',              N'Kingfisher Indian lager 0.33 cl', N'', 0),
(66, N'Cobra 0.33 cl',                   N'Cobra Indian lager 0.33 cl', N'', 0),
(67, N'Tuborg Jule Beer 0.33 cl',        N'Tuborg Christmas beer 0.33 cl', N'', 0),
(68, N'Salentein Red Wine',              N'Salentein Malbec red wine', N'', 0),
(69, N'Red Wine House (2)',              N'House red wine selection 2', N'', 0),
(70, N'Red Wine House (3)',              N'House red wine selection 3', N'', 0),
(71, N'Salentein White Wine',            N'Salentein Chardonnay white wine', N'', 0),
(72, N'White Wine House (2)',            N'House white wine selection 2', N'', 0);

SET IDENTITY_INSERT [MenuItems] OFF;

-- ============================================================
-- 4. Menu → Item mappings  (items 9, 13, 15 excluded — not in source data)
-- ============================================================
INSERT INTO [MenuItemsMappings] (MenuId, MenuItemId) VALUES
-- Menu 1: Fry Corner
(1,  1),(1,  2),(1,  3),(1,  4),(1,  5),
(1,  6),(1,  7),(1,  8),(1, 10),
-- Menu 2: Grill & Sizzler
(2, 11),(2, 12),(2, 14),(2, 16),(2, 17),(2, 18),
-- Menu 3: Chicken Corner
(3, 19),(3, 20),(3, 21),(3, 22),(3, 23),(3, 24),(3, 25),(3, 26),
-- Menu 4: Lamb Corner
(4, 27),(4, 28),(4, 29),(4, 30),(4, 31),(4, 32),(4, 33),(4, 34),
-- Menu 5: Veg & Vegan
(5, 35),(5, 36),(5, 37),(5, 38),(5, 39),(5, 40),(5, 41),(5, 42),
-- Menu 6: Rice & Biryani
(6, 43),(6, 44),(6, 45),(6, 46),
-- Menu 7: Naan Bread
(7, 47),(7, 48),(7, 49),(7, 50),
-- Menu 8: Kiddi Menu & Desserts
(8, 51),(8, 52),(8, 53),(8, 54),(8, 55),(8, 56),
-- Menu 9: Drinks
(9, 57),(9, 58),(9, 59),(9, 60),(9, 61),(9, 62),(9, 63),(9, 64),
-- Menu 10: Beer & Wines
(10, 65),(10, 66),(10, 67),(10, 68),(10, 69),(10, 70),(10, 71),(10, 72);

-- ============================================================
-- 5. Branch ↔ Menu links (both branches, all 10 menus)
-- ============================================================
INSERT INTO [BranchMenus] (BranchId, MenuId) VALUES
(1,1),(1,2),(1,3),(1,4),(1,5),(1,6),(1,7),(1,8),(1,9),(1,10),
(2,1),(2,2),(2,3),(2,4),(2,5),(2,6),(2,7),(2,8),(2,9),(2,10);

-- ============================================================
-- 6. Per-branch prices (same price for both branches)
-- ============================================================
INSERT INTO [BranchMenuItemPrices] (BranchId, MenuItemId, Price)
SELECT b.Id, i.Id, i.SourcePrice
FROM (VALUES
-- Fry Corner
( 1, 39.00),( 2, 49.00),( 3,119.00),( 4, 89.00),( 5, 49.00),
( 6, 59.00),( 7, 49.00),( 8, 49.00),(10, 59.00),
-- Grill & Sizzler
(11,139.00),(12,149.00),(14,149.00),(16,139.00),(17,139.00),(18,109.00),
-- Chicken Corner
(19,139.00),(20,139.00),(21,139.00),(22,139.00),(23,139.00),
(24,139.00),(25,139.00),(26,139.00),
-- Lamb Corner
(27,149.00),(28,149.00),(29,149.00),(30,149.00),(31,149.00),
(32,149.00),(33,149.00),(34,149.00),
-- Veg & Vegan
(35,129.00),(36,139.00),(37,139.00),(38,129.00),(39,129.00),
(40,129.00),(41,129.00),(42,149.00),
-- Rice & Biryani
(43,129.00),(44, 25.00),(45, 39.00),(46, 49.00),
-- Naan Bread
(47, 25.00),(48, 30.00),(49, 25.00),(50, 35.00),
-- Kiddi Menu & Desserts
(51, 69.00),(52, 39.00),(53, 49.00),(54, 30.00),(55, 35.00),(56, 39.00),
-- Drinks
(57, 25.00),(58, 25.00),(59, 25.00),(60, 25.00),(61, 25.00),(62, 25.00),
(63, 35.00),(64, 30.00),
-- Beer & Wines
(65, 45.00),(66, 45.00),(67, 20.00),
(68,159.00),(69,159.00),(70,159.00),(71,159.00),(72,159.00)
) AS i(ItemId, SourcePrice)
CROSS JOIN (SELECT Id FROM [Branches]) AS b;

COMMIT TRANSACTION;

PRINT 'Menu/item data reset complete.';
GO
