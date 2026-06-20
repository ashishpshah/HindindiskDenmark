# Functional Scope Coverage Analysis

## Review Summary
**Document Reviewed:** `implementation_plan.md`  
**Scope Checked Against:** Proposed Functional Scope (4.1 - 4.10)  
**Date:** 2026-06-19

---

## Coverage Status

| Topic | Status | Coverage Level |
|-------|--------|----------------|
| 4.1 Multi-Branch Support | ✅ Covered | 85% |
| 4.2 Online Ordering System | ⚠️ Partially Covered | 60% |
| 4.3 Order Status Tracking | ⚠️ Partially Covered | 50% |
| 4.4 Table Reservation | ⚠️ Partially Covered | 65% |
| 4.5 Payment Integration | ❌ Not Covered | 0% |
| 4.6 Menu Features | ✅ Covered | 90% |
| 4.7 Language Support | ❌ Not Covered | 0% |
| 4.8 Coupon & Offers Management | ⚠️ Partially Covered | 70% |
| 4.9 Reviews & Social Proof | ❌ Not Covered | 0% |
| 4.10 SEO-Friendly Structure | ❌ Not Covered | 0% |

---

## Detailed Analysis

### 4.1 Multi-Branch Support ✅ Covered (85%)

**Covered:**
- ✅ Both Denmark restaurant branches managed under one website (Branches entity)
- ✅ Each branch has its own menu (BranchMenus entity)
- ✅ Branch-wise pricing (BranchMenuItemPrices entity)
- ✅ Opening hours (WeekdayOpenTime, WeekdayCloseTime, WeekendOpenTime, WeekendCloseTime)
- ✅ Google Maps integration (GoogleMapsLink, GooglePlaceId)
- ✅ Google Business Profile links (GoogleBusinessProfileLink)
- ✅ Customers select preferred branch (implied through BranchId FK in Orders, Reservations)

**Missing:**
- ❌ Delivery/pickup availability per branch (no flag in Branches entity)
- ❌ Branch selection UI/API endpoint specification

---

### 4.2 Online Ordering System ⚠️ Partially Covered (60%)

**Covered:**
- ✅ Customers choose branch (BranchId in Orders)
- ✅ Browse branch-specific menu (GET /api/menu/items)
- ✅ Add items to cart with quantity (OrderItems.Quantity)
- ✅ Choose order type: Pickup or Delivery (OrderType field)
- ✅ Coupon/discount code at checkout (OrderAppliedOffers, Offers)
- ✅ Order summary with itemized list and total (Subtotal, DeliveryFee, Tax, Discount, Total)

**Missing:**
- ❌ Delivery address entry (no DeliveryAddress field in Orders)
- ❌ Estimated delivery time display (no ETA field)
- ❌ Payment integration (see 4.5)
- ❌ Order confirmation page
- ❌ Email notification to customer

---

### 4.3 Order Status Tracking ⚠️ Partially Covered (50%)

**Covered:**
- ✅ Status field exists with: Pending, Preparing, OutForDelivery, Delivered, Cancelled
- ✅ Customer can view orders (GET /api/orders/my)
- ✅ Single order tracking (GET /api/orders/{id})

**Missing:**
- ❌ "Accepted" status stage
- ❌ "Ready for Pickup" status stage
- ❌ "Completed" status (uses "Delivered" instead)
- ❌ Real-time status updates (no WebSocket/SignalR mentioned)
- ❌ Status update API for admin

---

### 4.4 Table Reservation ⚠️ Partially Covered (65%)

**Covered:**
- ✅ Select branch (BranchId in Reservations)
- ✅ Date selection (Date field)
- ✅ Time slot (TimeSlot field)
- ✅ Number of guests (GuestCount field)
- ✅ Special requests (SpecialRequests field)
- ✅ Status tracking (Status: Confirmed, Cancelled)
- ✅ Create reservation (POST /api/reservations)
- ✅ Cancel reservation (PUT /api/reservations/{id}/cancel)

**Missing:**
- ❌ Customer name, phone, email fields (assumes authenticated user only)
- ❌ Email confirmation to customer
- ❌ Email notification to restaurant team
- ❌ Admin view/confirm/cancel reservations endpoints

---

### 4.5 Payment Integration ❌ Not Covered (0%)

**Missing (entire topic):**
- ❌ MobilePay integration
- ❌ Credit/debit card payment (Visa, Mastercard, Dankort)
- ❌ Payment gateway (QuickPay, Stripe, or Nets Easy)
- ❌ Secure SSL checkout
- ❌ Payment receipt/invoice generation
- ❌ Email receipt to customer
- ❌ Payment status tracking in Orders

**Recommendation:** This is a critical gap. Add a Payment/Transactions entity and integrate with a Danish payment gateway.

---

### 4.6 Menu Features ✅ Covered (90%)

**Covered:**
- ✅ Category-wise menu display (Menus entity)
- ✅ Dish photo (ImageUrl in MenuItems)
- ✅ Name, description (Name, Description in MenuItems)
- ✅ Price per item (BranchMenuItemPrices.Price)
- ✅ Allergen labels (MenuLabels with Type "Allergen / Dietary")
- ✅ Dietary labels (MenuLabels)
- ✅ Spicy level (SpicyLevel in MenuItems)
- ✅ Filter by dietary preference (implied through MenuItemsMapping)
- ✅ Branch-wise price control (BranchMenuItemPrices)
- ✅ Branch-wise availability (IsActive in Menus)

**Missing:**
- ❌ Availability control per branch (no IsAvailable flag in BranchMenus or BranchMenuItemPrices)

---

### 4.7 Language Support ❌ Not Covered (0%)

**Missing (entire topic):**
- ❌ Danish language support
- ❌ English language support
- ❌ Language toggle button
- ❌ Translation management from admin
- ❌ Localized content for menu, legal pages

**Recommendation:** Add localization/i18n strategy to the plan.

---

### 4.8 Coupon & Offers Management ⚠️ Partially Covered (70%)

**Covered:**
- ✅ Create and manage promotional coupon codes (Offers entity)
- ✅ Discount type: percentage or fixed amount (DiscountType: Percent / FixedAmount)
- ✅ Validity dates (StartDate, EndDate)
- ✅ Usage limits (UsageLimit, UsageCount)
- ✅ Minimum order value (MinimumOrderAmount)
- ✅ Offers visible to customers (GET /api/menu/items with offers implied)

**Missing:**
- ❌ Admin management endpoints for offers
- ❌ Auto-apply functionality (IsAutoApply exists but no API specified)
- ❌ Free shipping offer type (FreeShipping in DiscountType but no logic)
- ❌ Free item offer type (FreeItem in DiscountType but no logic)
- ❌ Coupon code validation API

---

### 4.9 Reviews & Social Proof ❌ Not Covered (0%)

**Missing (entire topic):**
- ❌ Google Reviews widget
- ❌ Tripadvisor review badge
- ❌ Social media links (Facebook, Instagram)
- ❌ Social media integration in header/footer

**Recommendation:** This is frontend-focused but should be noted in the plan.

---

### 4.10 SEO-Friendly Structure ❌ Not Covered (0%)

**Missing (entire topic):**
- ❌ Clean URL structure specification
- ❌ Meta titles and descriptions manageable from admin
- ❌ Schema markup for restaurant/menu/location
- ❌ Google Analytics integration
- ❌ Meta Pixel integration
- ❌ Sitemap.xml configuration
- ❌ robots.txt configuration

**Recommendation:** This is primarily frontend/SEO work but should be documented.

---

## Summary

### Covered Topics (2/10)
- 4.1 Multi-Branch Support (85%)
- 4.6 Menu Features (90%)

### Partially Covered Topics (4/10)
- 4.2 Online Ordering System (60%)
- 4.3 Order Status Tracking (50%)
- 4.4 Table Reservation (65%)
- 4.8 Coupon & Offers Management (70%)

### Not Covered Topics (4/10)
- 4.5 Payment Integration (0%)
- 4.7 Language Support (0%)
- 4.9 Reviews & Social Proof (0%)
- 4.10 SEO-Friendly Structure (0%)

---

## Critical Gaps to Address

1. **Payment Integration** - Essential for online ordering. Add payment gateway selection and transaction tracking.
2. **Language Support** - Required for Danish market. Add i18n/localization strategy.
3. **SEO Structure** - Important for local search visibility in Denmark.
4. **Reviews & Social Proof** - Important for customer trust and marketing.
5. **Email Notifications** - Missing across orders, reservations, and payments.
6. **Admin Panel** - Missing management endpoints for menu, offers, reservations, orders.
7. **Delivery Address & ETA** - Missing from order flow.
8. **Real-time Order Tracking** - No WebSocket/SignalR mentioned for live updates.

### **REMOVED REQUIREMENTS (No Implementation Needed):**

- ✅ **Card Processing APIs** - Not needed
- ✅ **SSL Certificate for Payments** - Not needed  
- ✅ **Payment Gateway Integration** - Not needed
- ✅ **PCI Compliance** - Not needed
- ✅ **Payment Receipt Generation** - Manual processing now
