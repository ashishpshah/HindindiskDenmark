-- =============================================================================
-- Hind Indisk — Realistic Test Data Seed
-- Customers (12), Reservations (22), Orders (27)
-- All customer passwords: Test@1234
-- =============================================================================
SET NOCOUNT ON;


-- ── 1. CUSTOMERS (RoleId = 3) ────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM [Users] WHERE Id = 2)
BEGIN
    SET IDENTITY_INSERT [Users] ON;

    INSERT INTO [Users] (Id, Firstname, Lastname, Email, PasswordHash, Phone, RoleId, CreatedAt) VALUES
    ( 2, 'Anders',   'Nielsen',    'anders.nielsen@gmail.com',     '$2a$11$gZirgnRDh62ZX3rsjRFkNe8AbeutS5EDc1pGNIWWEAAUZN9Vh4B9G', '+45 20 11 22 33', 3, DATEADD(day,-90,GETUTCDATE())),
    ( 3, 'Sofie',    'Andersen',   'sofie.andersen@hotmail.com',   '$2a$11$gZirgnRDh62ZX3rsjRFkNe8AbeutS5EDc1pGNIWWEAAUZN9Vh4B9G', '+45 31 44 55 66', 3, DATEADD(day,-80,GETUTCDATE())),
    ( 4, 'Magnus',   'Jensen',     'magnus.jensen@yahoo.dk',       '$2a$11$gZirgnRDh62ZX3rsjRFkNe8AbeutS5EDc1pGNIWWEAAUZN9Vh4B9G', '+45 42 77 88 99', 3, DATEADD(day,-75,GETUTCDATE())),
    ( 5, 'Emma',     'Pedersen',   'emma.pedersen@gmail.com',      '$2a$11$gZirgnRDh62ZX3rsjRFkNe8AbeutS5EDc1pGNIWWEAAUZN9Vh4B9G', '+45 51 00 11 22', 3, DATEADD(day,-70,GETUTCDATE())),
    ( 6, 'Oliver',   'Christensen','oliver.chr@outlook.com',       '$2a$11$gZirgnRDh62ZX3rsjRFkNe8AbeutS5EDc1pGNIWWEAAUZN9Vh4B9G', '+45 60 33 44 55', 3, DATEADD(day,-65,GETUTCDATE())),
    ( 7, 'Laura',    'Hansen',     'laura.hansen@live.dk',         '$2a$11$gZirgnRDh62ZX3rsjRFkNe8AbeutS5EDc1pGNIWWEAAUZN9Vh4B9G', '+45 71 66 77 88', 3, DATEADD(day,-60,GETUTCDATE())),
    ( 8, 'Mikkel',   'Sørensen',   'mikkel.sorensen@gmail.com',    '$2a$11$gZirgnRDh62ZX3rsjRFkNe8AbeutS5EDc1pGNIWWEAAUZN9Vh4B9G', '+45 82 99 00 11', 3, DATEADD(day,-55,GETUTCDATE())),
    ( 9, 'Camilla',  'Larsen',     'camilla.larsen@hotmail.com',   '$2a$11$gZirgnRDh62ZX3rsjRFkNe8AbeutS5EDc1pGNIWWEAAUZN9Vh4B9G', '+45 93 22 33 44', 3, DATEADD(day,-50,GETUTCDATE())),
    (10, 'Rasmus',   'Rasmussen',  'rasmus.rasmussen@gmail.com',   '$2a$11$gZirgnRDh62ZX3rsjRFkNe8AbeutS5EDc1pGNIWWEAAUZN9Vh4B9G', '+45 40 55 66 77', 3, DATEADD(day,-45,GETUTCDATE())),
    (11, 'Mathilde', 'Eriksen',    'mathilde.eriksen@yahoo.dk',    '$2a$11$gZirgnRDh62ZX3rsjRFkNe8AbeutS5EDc1pGNIWWEAAUZN9Vh4B9G', '+45 50 88 99 00', 3, DATEADD(day,-40,GETUTCDATE())),
    (12, 'Frederik', 'Mortensen',  'frederik.mortensen@gmail.com', '$2a$11$gZirgnRDh62ZX3rsjRFkNe8AbeutS5EDc1pGNIWWEAAUZN9Vh4B9G', '+45 61 11 22 33', 3, DATEADD(day,-30,GETUTCDATE())),
    (13, 'Isabella', 'Thomsen',    'isabella.thomsen@live.dk',     '$2a$11$gZirgnRDh62ZX3rsjRFkNe8AbeutS5EDc1pGNIWWEAAUZN9Vh4B9G', '+45 72 44 55 66', 3, DATEADD(day,-20,GETUTCDATE()));

    SET IDENTITY_INSERT [Users] OFF;
    PRINT 'Inserted 12 customers (Id 2–13).';
END
ELSE
    PRINT 'Customers already present — skipping.';


-- ── 2. RESERVATIONS ──────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM [Reservations] WHERE Id = 1)
BEGIN
    SET IDENTITY_INSERT [Reservations] ON;

    INSERT INTO [Reservations]
        (Id, UserId, BranchId, Date, TimeSlot, GuestCount,
         ContactName, ContactPhone, ContactEmail,
         SpecialRequests, Status, CreatedAt)
    VALUES
    -- Past confirmed — Aarhus
    ( 1,  2, 1, DATEADD(day,-60,GETUTCDATE()), '18:00', 2, 'Anders Nielsen',    '+45 20 11 22 33','anders.nielsen@gmail.com',   NULL,                              'Confirmed', DATEADD(day,-62,GETUTCDATE())),
    ( 2,  3, 1, DATEADD(day,-55,GETUTCDATE()), '19:30', 4, 'Sofie Andersen',    '+45 31 44 55 66','sofie.andersen@hotmail.com', 'Vegetarian options please',       'Confirmed', DATEADD(day,-57,GETUTCDATE())),
    ( 3,  4, 1, DATEADD(day,-50,GETUTCDATE()), '20:00', 2, 'Magnus Jensen',     '+45 42 77 88 99','magnus.jensen@yahoo.dk',     NULL,                              'Confirmed', DATEADD(day,-52,GETUTCDATE())),
    ( 4,  5, 2, DATEADD(day,-45,GETUTCDATE()), '12:30', 6, 'Emma Pedersen',     '+45 51 00 11 22','emma.pedersen@gmail.com',    'Birthday dinner, 1 high chair',   'Confirmed', DATEADD(day,-47,GETUTCDATE())),
    ( 5,  6, 2, DATEADD(day,-40,GETUTCDATE()), '13:00', 2, 'Oliver Christensen','+45 60 33 44 55','oliver.chr@outlook.com',     NULL,                              'Confirmed', DATEADD(day,-42,GETUTCDATE())),
    ( 6,  7, 1, DATEADD(day,-35,GETUTCDATE()), '18:30', 3, 'Laura Hansen',      '+45 71 66 77 88','laura.hansen@live.dk',       'Window table preferred',          'Confirmed', DATEADD(day,-37,GETUTCDATE())),
    ( 7,  8, 2, DATEADD(day,-30,GETUTCDATE()), '20:30', 5, 'Mikkel Sørensen',   '+45 82 99 00 11','mikkel.sorensen@gmail.com',  'Nut allergy — 1 person',          'Confirmed', DATEADD(day,-32,GETUTCDATE())),
    ( 8,  9, 1, DATEADD(day,-28,GETUTCDATE()), '19:00', 2, 'Camilla Larsen',    '+45 93 22 33 44','camilla.larsen@hotmail.com', NULL,                              'Confirmed', DATEADD(day,-30,GETUTCDATE())),
    ( 9, 10, 2, DATEADD(day,-21,GETUTCDATE()), '12:00', 8, 'Rasmus Rasmussen',  '+45 40 55 66 77','rasmus.rasmussen@gmail.com', 'Corporate lunch, invoice needed', 'Confirmed', DATEADD(day,-23,GETUTCDATE())),
    (10, 11, 1, DATEADD(day,-14,GETUTCDATE()), '18:00', 4, 'Mathilde Eriksen',  '+45 50 88 99 00','mathilde.eriksen@yahoo.dk',  'Gluten-free for 1 guest',         'Confirmed', DATEADD(day,-16,GETUTCDATE())),
    -- Past cancelled
    (11, 12, 2, DATEADD(day,-20,GETUTCDATE()), '19:00', 2, 'Frederik Mortensen','+45 61 11 22 33','frederik.mortensen@gmail.com',NULL,                             'Cancelled', DATEADD(day,-22,GETUTCDATE())),
    (12, 13, 1, DATEADD(day,-10,GETUTCDATE()), '20:00', 3, 'Isabella Thomsen',  '+45 72 44 55 66','isabella.thomsen@live.dk',   NULL,                              'Cancelled', DATEADD(day,-11,GETUTCDATE())),
    -- Recent confirmed
    (13, 13, 1, DATEADD(day, -7,GETUTCDATE()), '18:30', 2, 'Isabella Thomsen',  '+45 72 44 55 66','isabella.thomsen@live.dk',   'Anniversary — candle please',     'Confirmed', DATEADD(day, -9,GETUTCDATE())),
    (14,  2, 2, DATEADD(day, -5,GETUTCDATE()), '19:30', 4, 'Anders Nielsen',    '+45 20 11 22 33','anders.nielsen@gmail.com',   NULL,                              'Confirmed', DATEADD(day, -6,GETUTCDATE())),
    (15,  3, 1, DATEADD(day, -3,GETUTCDATE()), '13:00', 2, 'Sofie Andersen',    '+45 31 44 55 66','sofie.andersen@hotmail.com', 'Lunch, quick service needed',     'Confirmed', DATEADD(day, -4,GETUTCDATE())),
    -- Upcoming pending
    (16,  4, 2, DATEADD(day,  3,GETUTCDATE()), '18:00', 6, 'Magnus Jensen',     '+45 42 77 88 99','magnus.jensen@yahoo.dk',     'Family reunion',                  'Pending',   DATEADD(day,  1,GETUTCDATE())),
    (17,  5, 1, DATEADD(day,  5,GETUTCDATE()), '19:00', 2, 'Emma Pedersen',     '+45 51 00 11 22','emma.pedersen@gmail.com',    NULL,                              'Pending',   DATEADD(day,  2,GETUTCDATE())),
    (18,  6, 2, DATEADD(day,  7,GETUTCDATE()), '12:30', 4, 'Oliver Christensen','+45 60 33 44 55','oliver.chr@outlook.com',     'High chair needed',               'Pending',   DATEADD(day,  3,GETUTCDATE())),
    (19,  7, 1, DATEADD(day, 10,GETUTCDATE()), '20:00', 2, 'Laura Hansen',      '+45 71 66 77 88','laura.hansen@live.dk',       NULL,                              'Confirmed', DATEADD(day,  4,GETUTCDATE())),
    (20,  8, 2, DATEADD(day, 14,GETUTCDATE()), '19:30', 8, 'Mikkel Sørensen',   '+45 82 99 00 11','mikkel.sorensen@gmail.com',  'Company dinner — separate bills', 'Confirmed', DATEADD(day,  5,GETUTCDATE())),
    (21,  9, 1, DATEADD(day, 12,GETUTCDATE()), '18:00', 2, 'Camilla Larsen',    '+45 93 22 33 44','camilla.larsen@hotmail.com', NULL,                              'Pending',   DATEADD(day,  6,GETUTCDATE())),
    (22, 10, 1, DATEADD(day, 20,GETUTCDATE()), '13:00', 5, 'Rasmus Rasmussen',  '+45 40 55 66 77','rasmus.rasmussen@gmail.com', 'Dairy-free menu options please',  'Pending',   DATEADD(day,  7,GETUTCDATE()));

    SET IDENTITY_INSERT [Reservations] OFF;
    PRINT 'Inserted 22 reservations (Id 1–22).';
END
ELSE
    PRINT 'Reservations already present — skipping.';


-- ── 3. ORDERS ────────────────────────────────────────────────────────────────
-- UserId must reference an existing User (NOT NULL).
-- CouponCode is NOT on Orders — see OrderAppliedOffers section below.
IF NOT EXISTS (SELECT 1 FROM [Orders] WHERE Id = 1)
BEGIN
    SET IDENTITY_INSERT [Orders] ON;

    INSERT INTO [Orders]
        (Id, UserId, BranchId, OrderType, Status,
         Subtotal, DeliveryFee, Discount, Tax, Total,
         ContactName, ContactPhone, ContactEmail,
         DeliveryAddress, PaymentMethod, CreatedAt)
    VALUES
    -- Completed Delivery
    ( 1,  2, 1,'Delivery', 'Completed', 278.00,39.00,  0.00, 55.60,317.00,'Anders Nielsen',    '+45 20 11 22 33','anders.nielsen@gmail.com',   'Frederiksgade 12, 2.tv., 8000 Aarhus C',          'Card', DATEADD(day,-55,GETUTCDATE())),
    ( 2,  3, 2,'Delivery', 'Completed', 417.00,39.00,  0.00, 83.40,456.00,'Sofie Andersen',    '+45 31 44 55 66','sofie.andersen@hotmail.com', 'Vesterbrogade 12, 3.tv., 1620 København V',       'Card', DATEADD(day,-50,GETUTCDATE())),
    ( 3,  4, 1,'Pickup',   'Completed', 348.00, 0.00,  0.00, 69.60,348.00,'Magnus Jensen',     '+45 42 77 88 99','magnus.jensen@yahoo.dk',     NULL,                                              'Cash', DATEADD(day,-48,GETUTCDATE())),
    -- Order 4: WELCOME10 — 10% discount (55.60 off 556.00 subtotal, delivery free via FREEDELIVERY would be separate)
    ( 4,  5, 2,'Delivery', 'Completed', 556.00,39.00, 55.60,100.08,539.40,'Emma Pedersen',     '+45 51 00 11 22','emma.pedersen@gmail.com',    'Istedgade 44, 1650 København V',                  'Card', DATEADD(day,-45,GETUTCDATE())),
    ( 5,  6, 1,'Pickup',   'Completed', 139.00, 0.00,  0.00, 27.80,139.00,'Oliver Christensen','+45 60 33 44 55','oliver.chr@outlook.com',     NULL,                                              'Card', DATEADD(day,-42,GETUTCDATE())),
    ( 6,  7, 2,'Delivery', 'Completed', 298.00,39.00,  0.00, 59.60,337.00,'Laura Hansen',      '+45 71 66 77 88','laura.hansen@live.dk',       'Nørrebrogade 78, 1., 2200 København N',           'Card', DATEADD(day,-40,GETUTCDATE())),
    ( 7,  8, 1,'Delivery', 'Completed', 427.00,39.00,  0.00, 85.40,466.00,'Mikkel Sørensen',   '+45 82 99 00 11','mikkel.sorensen@gmail.com',  'Mejlgade 23, 8000 Aarhus C',                      'Card', DATEADD(day,-38,GETUTCDATE())),
    -- Order 8: FAMILY20 — 20% discount (57.60 off 288.00 subtotal)
    ( 8,  9, 2,'Pickup',   'Completed', 288.00, 0.00, 57.60, 46.08,230.40,'Camilla Larsen',    '+45 93 22 33 44','camilla.larsen@hotmail.com', NULL,                                              'Cash', DATEADD(day,-35,GETUTCDATE())),
    ( 9, 10, 1,'Delivery', 'Completed', 199.00,39.00,  0.00, 39.80,238.00,'Rasmus Rasmussen',  '+45 40 55 66 77','rasmus.rasmussen@gmail.com', 'Skanderborgvej 3, 8000 Aarhus C',                 'Card', DATEADD(day,-32,GETUTCDATE())),
    (10, 11, 2,'Delivery', 'Completed', 477.00,39.00,  0.00, 95.40,516.00,'Mathilde Eriksen',  '+45 50 88 99 00','mathilde.eriksen@yahoo.dk',  'Vesterbrogade 99, 1620 København V',              'Card', DATEADD(day,-30,GETUTCDATE())),
    (11, 12, 1,'Pickup',   'Completed', 268.00, 0.00,  0.00, 53.60,268.00,'Frederik Mortensen','+45 61 11 22 33','frederik.mortensen@gmail.com',NULL,                                             'Cash', DATEADD(day,-28,GETUTCDATE())),
    (12, 13, 2,'Pickup',   'Completed', 338.00, 0.00,  0.00, 67.60,338.00,'Isabella Thomsen',  '+45 72 44 55 66','isabella.thomsen@live.dk',   NULL,                                              'Card', DATEADD(day,-25,GETUTCDATE())),
    (13,  2, 1,'Delivery', 'Completed', 178.00,39.00,  0.00, 35.60,217.00,'Anders Nielsen',    '+45 20 11 22 33','anders.nielsen@gmail.com',   'Frederiksgade 12, 2.tv., 8000 Aarhus C',          'Card', DATEADD(day,-22,GETUTCDATE())),
    -- Order 14: FREEDELIVERY — delivery fee waived (0 DeliveryFee)
    (14,  3, 2,'Delivery', 'Completed', 316.00, 0.00,  0.00, 63.20,316.00,'Sofie Andersen',    '+45 31 44 55 66','sofie.andersen@hotmail.com', 'Vesterbrogade 12, 3.tv., 1620 København V',       'Card', DATEADD(day,-20,GETUTCDATE())),
    -- Cancelled
    (15,  4, 1,'Delivery', 'Cancelled', 139.00,39.00,  0.00, 27.80,178.00,'Magnus Jensen',     '+45 42 77 88 99','magnus.jensen@yahoo.dk',     'Nørre Allé 9, 8000 Aarhus C',                     'Card', DATEADD(day,-18,GETUTCDATE())),
    (16,  5, 2,'Delivery', 'Cancelled', 278.00,39.00,  0.00, 55.60,317.00,'Emma Pedersen',     '+45 51 00 11 22','emma.pedersen@gmail.com',    'Østerbrogade 55, 2100 København Ø',               'Card', DATEADD(day,-15,GETUTCDATE())),
    -- Recent completed
    (17,  5, 2,'Delivery', 'Completed', 397.00,39.00,  0.00, 79.40,436.00,'Emma Pedersen',     '+45 51 00 11 22','emma.pedersen@gmail.com',    'Istedgade 44, 1650 København V',                  'Card', DATEADD(day,-12,GETUTCDATE())),
    (18,  6, 1,'Pickup',   'Completed', 288.00, 0.00,  0.00, 57.60,288.00,'Oliver Christensen','+45 60 33 44 55','oliver.chr@outlook.com',     NULL,                                              'Cash', DATEADD(day,-10,GETUTCDATE())),
    (19,  7, 2,'Delivery', 'Completed', 447.00,39.00,  0.00, 89.40,486.00,'Laura Hansen',      '+45 71 66 77 88','laura.hansen@live.dk',       'Nørrebrogade 78, 1., 2200 København N',           'Card', DATEADD(day, -8,GETUTCDATE())),
    (20,  8, 1,'Pickup',   'Completed', 198.00, 0.00,  0.00, 39.60,198.00,'Mikkel Sørensen',   '+45 82 99 00 11','mikkel.sorensen@gmail.com',  NULL,                                              'Card', DATEADD(day, -6,GETUTCDATE())),
    -- Live / in-progress
    (21, 10, 2,'Delivery', 'OutForDelivery',318.00,39.00,0.00,63.60,357.00,'Rasmus Rasmussen', '+45 40 55 66 77','rasmus.rasmussen@gmail.com', 'Vesterbrogade 99, 1620 København V',              'Card', DATEADD(hour, -2,GETUTCDATE())),
    (22,  9, 1,'Pickup',   'Ready',     179.00, 0.00,  0.00, 35.80,179.00,'Camilla Larsen',    '+45 93 22 33 44','camilla.larsen@hotmail.com', NULL,                                              'Card', DATEADD(hour, -1,GETUTCDATE())),
    (23, 11, 2,'Delivery', 'Preparing', 257.00,39.00,  0.00, 51.40,296.00,'Mathilde Eriksen',  '+45 50 88 99 00','mathilde.eriksen@yahoo.dk',  'Vesterbrogade 30, 1620 København V',              'Card', DATEADD(minute,-45,GETUTCDATE())),
    (24, 12, 1,'Delivery', 'Accepted',  338.00,39.00,  0.00, 67.60,377.00,'Frederik Mortensen','+45 61 11 22 33','frederik.mortensen@gmail.com','Åboulevarden 17, 8000 Aarhus C',                 'Card', DATEADD(minute,-30,GETUTCDATE())),
    (25, 13, 2,'Pickup',   'Placed',    218.00, 0.00,  0.00, 43.60,218.00,'Isabella Thomsen',  '+45 72 44 55 66','isabella.thomsen@live.dk',   NULL,                                              'Card', DATEADD(minute,-15,GETUTCDATE())),
    (26,  2, 1,'Delivery', 'Placed',    298.00,39.00,  0.00, 59.60,337.00,'Anders Nielsen',    '+45 20 11 22 33','anders.nielsen@gmail.com',   'Frederiksgade 12, 2.tv., 8000 Aarhus C',          'Card', DATEADD(minute, -8,GETUTCDATE())),
    (27,  3, 2,'Delivery', 'Placed',    178.00,39.00,  0.00, 35.60,217.00,'Sofie Andersen',    '+45 31 44 55 66','sofie.andersen@hotmail.com', 'Gammel Kongevej 88, 1850 Frederiksberg',           'Card', DATEADD(minute, -3,GETUTCDATE()));

    SET IDENTITY_INSERT [Orders] OFF;
    PRINT 'Inserted 27 orders (Id 1–27).';
END
ELSE
    PRINT 'Orders already present — skipping.';


-- ── 4. ORDER APPLIED OFFERS (coupon links) ───────────────────────────────────
-- OfferId 1 = WELCOME10 (10%), OfferId 2 = FAMILY20 (20%), OfferId 3 = FREEDELIVERY
IF NOT EXISTS (SELECT 1 FROM [OrderAppliedOffers] WHERE OrderId = 4)
BEGIN
    INSERT INTO [OrderAppliedOffers] (OrderId, OfferId, AppliedDiscountAmount) VALUES
    ( 4, 1, 55.60),   -- Order 4: WELCOME10 — 10% of 556.00
    ( 8, 2, 57.60),   -- Order 8: FAMILY20  — 20% of 288.00
    (14, 3,  0.00);   -- Order 14: FREEDELIVERY — waived 39 DKK fee (tracked as 0 discount amount)
    PRINT 'Inserted order applied offers.';
END
ELSE
    PRINT 'Order applied offers already present — skipping.';


-- ── 5. ORDER ITEMS ───────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM [OrderItems] WHERE OrderId = 1)
BEGIN
    INSERT INTO [OrderItems] (OrderId, MenuId, MenuItemId, Quantity, PriceAtPurchase) VALUES
    -- Order 1: Butter Chicken + 2x Garlic Naan + Pilau Rice
    (1, 3,19,1,139.00),(1, 7,48,2,30.00),(1, 6,45,1,39.00),
    -- Order 2: Lamb Tikka Masala + Lamb Butter + 2x Plain Naan + Plain Rice
    (2, 4,28,1,149.00),(2, 4,31,1,149.00),(2, 7,47,2,25.00),(2, 6,44,1,25.00),
    -- Order 3: Chicken Tikka Masala + Chicken Korma + Garlic Naan + Pilau Rice
    (3, 3,21,1,139.00),(3, 3,22,1,139.00),(3, 7,48,1,30.00),(3, 6,45,1,39.00),
    -- Order 4: Chicken Korma + Lamb Korma + Veg Biryani + 2x Garlic Naan + 2x Mango Lassi
    (4, 3,22,1,139.00),(4, 4,27,1,149.00),(4, 6,43,1,129.00),(4, 7,48,2,30.00),(4, 9,63,2,35.00),
    -- Order 5: Chicken Tikka Masala
    (5, 3,21,1,139.00),
    -- Order 6: Lamb Tikka Masala + Pilau Rice + Garlic Naan + 2x Coca-Cola
    (6, 4,28,1,149.00),(6, 6,45,1,39.00),(6, 7,48,1,30.00),(6, 9,57,2,25.00),
    -- Order 7: Chicken Hyderabadi + Lamb Madras + 2x Garlic Naan + Pilau Rice + Egg Rice
    (7, 3,23,1,139.00),(7, 4,33,1,149.00),(7, 7,48,2,30.00),(7, 6,45,1,39.00),(7, 6,46,1,49.00),
    -- Order 8: Paneer Masala + Mix Vegetable + Garlic Naan + Tandoori Roti
    (8, 5,36,1,139.00),(8, 5,35,1,129.00),(8, 7,48,1,30.00),(8, 7,49,1,25.00),
    -- Order 9: Butter Chicken + Plain Rice + Garlic Naan
    (9, 3,19,1,139.00),(9, 6,44,1,25.00),(9, 7,48,1,30.00),
    -- Order 10: Lamb Butter + Chicken Tikka + 2x Garlic Naan + 2x Pilau Rice + 2x Mango Lassi
    (10,4,31,1,149.00),(10,2,17,1,139.00),(10,7,48,2,30.00),(10,6,45,2,39.00),(10,9,63,2,35.00),
    -- Order 11: Chicken Spinach + Lamb Spinach + 2x Plain Naan
    (11,3,20,1,139.00),(11,4,34,1,149.00),(11,7,47,2,25.00),
    -- Order 12: Lamb Vindaloo + Lamb Karahi + Garlic Naan + Cheese Naan + Pilau Rice
    (12,4,32,1,149.00),(12,4,29,1,149.00),(12,7,48,1,30.00),(12,7,50,1,35.00),(12,6,45,1,39.00),
    -- Order 13: Chicken Madras + Garlic Naan + Coca-Cola
    (13,3,24,1,139.00),(13,7,48,1,30.00),(13,9,57,1,25.00),
    -- Order 14: Chicken Korma + Paneer Spinach + Garlic Naan + Plain Rice + Fresh Lassi
    (14,3,22,1,139.00),(14,5,37,1,139.00),(14,7,48,1,30.00),(14,6,44,1,25.00),(14,9,64,1,30.00),
    -- Order 15 (cancelled): Chicken Tikka Masala + Garlic Naan
    (15,3,21,1,139.00),(15,7,48,1,30.00),
    -- Order 16 (cancelled): Lamb Butter + Plain Rice + Garlic Naan + Sprite
    (16,4,31,1,149.00),(16,6,44,1,25.00),(16,7,48,1,30.00),(16,9,59,1,25.00),
    -- Order 17: Chicken Hyderabadi + Lamb Karahi + Garlic Naan + Pilau Rice + 2x Coca-Cola
    (17,3,23,1,139.00),(17,4,29,1,149.00),(17,7,48,1,30.00),(17,6,45,1,39.00),(17,9,57,2,25.00),
    -- Order 18: Lamb Hyderabadi + 2x Garlic Naan + Pilau Rice
    (18,4,30,1,149.00),(18,7,48,2,30.00),(18,6,45,1,39.00),
    -- Order 19: Butter Chicken + Lamb Tikka + Chicken Tikka + 2x Garlic Naan + Egg Rice + Mango Lassi
    (19,3,19,1,139.00),(19,4,28,1,149.00),(19,2,17,1,139.00),(19,7,48,2,30.00),(19,6,46,1,49.00),(19,9,63,1,35.00),
    -- Order 20: Paneer Masala + Aloo Palak + Garlic Naan + Cheese Naan
    (20,5,36,1,139.00),(20,5,40,1,129.00),(20,7,48,1,30.00),(20,7,50,1,35.00),
    -- Order 21 (OutForDelivery): Chicken Korma + Lamb Korma + Plain Naan + Pilau Rice
    (21,3,22,1,139.00),(21,4,27,1,149.00),(21,7,47,1,25.00),(21,6,45,1,39.00),
    -- Order 22 (Ready): Chicken Spinach + Plain Rice + Garlic Naan
    (22,3,20,1,139.00),(22,6,44,1,25.00),(22,7,48,1,30.00),
    -- Order 23 (Preparing): Lamb Butter + Garlic Naan + Pilau Rice + Mango Lassi
    (23,4,31,1,149.00),(23,7,48,1,30.00),(23,6,45,1,39.00),(23,9,63,1,35.00),
    -- Order 24 (Accepted): Chicken Tikka Masala + Chicken Madras + 2x Garlic Naan + Egg Rice
    (24,3,21,1,139.00),(24,3,24,1,139.00),(24,7,48,2,30.00),(24,6,46,1,39.00),
    -- Order 25 (Placed): Lamb Madras + Plain Naan + Pilau Rice
    (25,4,33,1,149.00),(25,7,47,1,25.00),(25,6,45,1,39.00),
    -- Order 26 (Placed): Butter Chicken + Lamb Spinach + Garlic Naan + Plain Rice + 2x Coca-Cola
    (26,3,19,1,139.00),(26,4,34,1,149.00),(26,7,48,1,30.00),(26,6,44,1,25.00),(26,9,57,2,25.00),
    -- Order 27 (Placed): Chicken Korma + Garlic Naan + Pilau Rice + Sprite
    (27,3,22,1,139.00),(27,7,48,1,30.00),(27,6,45,1,39.00),(27,9,59,1,25.00);

    PRINT 'Inserted order items for all 27 orders.';
END
ELSE
    PRINT 'Order items already present — skipping.';

PRINT '=== Seed complete ===';
