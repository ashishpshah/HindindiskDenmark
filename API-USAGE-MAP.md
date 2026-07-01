# API Usage Map — Hind Indisk

> Auto-generated audit of every backend endpoint, the frontend hook that calls it,
> and every page/component that consumes that hook.
> Last updated: 2026-06-26

---

## Legend

| Symbol | Meaning |
|--------|---------|
| 🌐 | Public — no authentication required |
| 🔐 | Authenticated — valid JWT required (any logged-in user) |
| 🛡️ | Admin only — JWT with role `SystemAdmin` or `Admin` |
| ↔️ | Shared — used by both public pages and admin pages |

---

## 1. Auth — `/api/auth`

> Handled directly inside `AuthContext` (not a separate hook file).

| Method | Endpoint | Hook / Caller | Page / Component | Auth |
|--------|----------|---------------|-----------------|------|
| POST | `/api/auth/register` | `AuthContext` direct | `__root.tsx` | 🌐 |
| POST | `/api/auth/login` | `AuthContext` direct | `__root.tsx` | 🌐 |
| GET  | `/api/auth/me` | `AuthContext` direct | `__root.tsx` (auto on load) | 🌐 |
| PUT  | `/api/auth/profile` | `useUpdateProfile` | `account.profile.tsx` | 🔐 |
| POST | `/api/auth/forgot-password` | direct `apiFetch` | password-reset flow | 🌐 |
| POST | `/api/auth/reset-password` | direct `apiFetch` | password-reset flow | 🌐 |

**Notes**
- `GET /me` fires automatically on every page load to rehydrate the logged-in user from the token stored in `localStorage`.
- Auth state is stored in `AuthContext`, not React Query — there is no cache layer for these calls.

---

## 2. Menu — `/api/menu`

| Method | Endpoint | Hook | Page / Component | Auth |
|--------|----------|------|-----------------|------|
| GET | `/api/menu/categories` | `useMenuCategories` | `menu.index.tsx` | 🌐 |
| GET | `/api/menu/items` | `useMenuItems` | `menu.index.tsx`, `Sections.tsx` (FeaturedMenu signature carousel) | 🌐 |
| GET | `/api/menu/items/{name}` | `useMenuItem` | `menu.$name.tsx` | 🌐 |

**Notes**
- `useMenuItems` is called twice: once on the full menu page with filter params (`category`, `q`, `veg`, `branchId`), and once in `Sections.tsx` with `{ signature: true, branchId }` for the home page carousel.
- The backend `MenuService` runs a **3-pass query** for `GetItemsAsync`: Pass 1 = items + category, Pass 2 = labels, Pass 3 = branch prices. This avoids the cartesian-explosion problem of a single multi-include query.
- `GET /items/{name}` fetches a single item **plus** related items in the same category (also 3-pass).
- Bilingual fields returned by API: `nameDa`, `descriptionDa`, `categoryDa`. Frontend selects with `loc(en, da)`.

---

## 3. Locations — `/api/locations` ↔️

| Method | Endpoint | Hook | Page / Component | Auth |
|--------|----------|------|-----------------|------|
| GET | `/api/locations` | `useBranches` | See consumer list below | 🌐 |

**Consumer list for `useBranches` (13 consumers — most shared hook in the app)**

| Side | Page / Component |
|------|-----------------|
| Public | `reservation.tsx` |
| Public | `locations.tsx` |
| Public | `contact.tsx` |
| Public | `checkout.tsx` |
| Public | `menu.index.tsx` (branch selector + price lookup) |
| Public | `menu.$name.tsx` (branch price lookup) |
| Public | `Sections.tsx` (FeaturedMenu — resolves branchId for price) |
| Public | `Footer.tsx` (branch address/phone list) |
| Admin  | `admin.menu.new.tsx` |
| Admin  | `admin.menu.$itemId.tsx` |
| Admin  | `admin.menus.$menuId.tsx` |
| Admin  | `admin.offers.$offerId.tsx` |
| Admin  | `admin.orders.tsx` |
| Admin  | `admin.reservations.tsx` |

**Notes**
- `staleTime: 60 minutes` — branches rarely change so this is cached aggressively.
- This is the **only** endpoint consumed by both the public site and the admin panel.
- The admin panel also has a separate `GET /api/admin/branches` (see §9) for edit/create operations; `useBranches` is read-only display.

---

## 4. Offers — `/api/offers`

| Method | Endpoint | Hook | Page / Component | Auth |
|--------|----------|------|-----------------|------|
| GET | `/api/offers` | `usePublicOffers` | `offers.tsx`, `account.coupons.tsx` | 🌐 |
| GET | `/api/offers/home` | `useHomeOffers` | `Sections.tsx` (Offers section) | 🌐 |
| GET | `/api/offers/validate?code=` | inside `useCreateOrder` | `checkout.tsx` (coupon validation) | 🌐 |

**Notes**
- `PublicOfferDto` currently has no `*Da` bilingual fields — offer titles/descriptions are English-only from the API. Backend change needed to add `TitleDa`, `DescriptionDa`.
- `usePublicOffers` and `useHomeOffers` call different endpoints; `/home` presumably returns only `IsShowOnHome == true` offers.
- Coupon validation is not a standalone hook — it is called directly inside the `useCreateOrder` mutation before the order POST.

---

## 5. Orders — `/api/orders`

| Method | Endpoint | Hook | Page / Component | Auth |
|--------|----------|------|-----------------|------|
| POST | `/api/orders` | `useCreateOrder` | `checkout.tsx` | 🔐 |
| GET  | `/api/orders/my` | `useMyOrders` | `account.orders.tsx`, `account.index.tsx` | 🔐 |
| GET  | `/api/orders/{id}` | `useOrder` | `order-tracking.tsx` | 🔐 |

**Notes**
- `useCreateOrder` handles: coupon validation → order POST → cart clear → redirect.
- `account.index.tsx` (dashboard) calls `useMyOrders` for the recent-orders summary widget.

---

## 6. Reservations — `/api/reservations`

| Method | Endpoint | Hook / Caller | Page / Component | Auth |
|--------|----------|---------------|-----------------|------|
| POST | `/api/reservations` | `useCreateReservation` | `reservation.tsx`, `locations.tsx` | 🌐 |
| GET  | `/api/reservations/check-duplicate` | direct `apiFetch` | `reservation.tsx`, `locations.tsx` | 🌐 |
| GET  | `/api/reservations/my` | `useMyReservations` | `account.reservations.tsx`, `account.index.tsx` | 🔐 |

**Notes**
- Duplicate check (`/check-duplicate?phone=&email=&date=&timeSlot=`) is called **before** the POST on every submit. If duplicates exist, a warning modal is shown; user can proceed anyway via a second call to the same mutation.
- Both `reservation.tsx` (full page) and `locations.tsx` (modal) share identical booking logic.

---

## 7. Addresses — `/api/addresses`

| Method | Endpoint | Hook | Page / Component | Auth |
|--------|----------|------|-----------------|------|
| GET    | `/api/addresses` | `useAddresses` | `account.addresses.tsx`, `checkout.tsx` | 🔐 |
| POST   | `/api/addresses` | `useAddAddress` | `account.addresses.tsx` | 🔐 |
| PUT    | `/api/addresses/{id}` | `useUpdateAddress` | `account.addresses.tsx` | 🔐 |
| DELETE | `/api/addresses/{id}` | `useDeleteAddress` | `account.addresses.tsx` | 🔐 |

**Notes**
- `checkout.tsx` reads saved addresses so the user can select a delivery address without re-typing.
- All four CRUD operations surface in a single page (`account.addresses.tsx`).

---

## 8. Customers — `/api/customers`

| Method | Endpoint | Hook | Page / Component | Auth |
|--------|----------|------|-----------------|------|
| GET | `/api/customers/lookup?phone=&email=` | `useCustomerLookup` | `reservation.tsx`, `locations.tsx`, `checkout.tsx` | 🌐 |

**Notes**
- Used for **auto-fill**: as the user types a phone or email, the hook debounces and looks up an existing customer. If found, first/last name and email are populated automatically.
- The hook fires only when phone ≥ 8 chars or email contains `@`.

---

## 9. Contact — `/api/contact`

| Method | Endpoint | Hook / Caller | Page / Component | Auth |
|--------|----------|---------------|-----------------|------|
| POST | `/api/contact` | direct `apiFetch` | `contact.tsx` | 🌐 |

**Notes**
- No dedicated hook — a one-off POST inside the form submit handler.

---

## 10. Admin — `/api/admin` 🛡️

> All endpoints require JWT with role `SystemAdmin` or `Admin`.
> Authorization is enforced at the class level: `[Authorize(Roles = "SystemAdmin,Admin")]` on `AdminController`.

### 10a. Dashboard

| Method | Endpoint | Hook | Admin Page |
|--------|----------|------|-----------|
| GET | `/api/admin/dashboard` | `useAdminDashboard` | `admin.index.tsx` |

---

### 10b. Orders

| Method | Endpoint | Hook | Admin Page |
|--------|----------|------|-----------|
| GET   | `/api/admin/orders?status=&branchId=` | `useAdminOrders` | `admin.orders.tsx` |
| PATCH | `/api/admin/orders/{id}/status` | `useUpdateOrderStatus` | `admin.orders.tsx` |

---

### 10c. Reservations

| Method | Endpoint | Hook | Admin Page |
|--------|----------|------|-----------|
| GET   | `/api/admin/reservations?status=&branchId=&date=` | `useAdminReservations` | `admin.reservations.tsx` |
| PATCH | `/api/admin/reservations/{id}/status` | `useUpdateReservationStatus` | `admin.reservations.tsx` |

---

### 10d. Menus (Categories)

| Method | Endpoint | Hook | Admin Page(s) |
|--------|----------|------|--------------|
| GET    | `/api/admin/menus` | `useAdminMenus` | `admin.menus.index.tsx`, `admin.menus.new.tsx`, `admin.menus.$menuId.tsx`, `admin.menu.new.tsx`, `admin.menu.$itemId.tsx` |
| POST   | `/api/admin/menus` | `useCreateMenu` | `admin.menus.new.tsx` |
| PUT    | `/api/admin/menus/{id}` | `useUpdateMenu` | `admin.menus.$menuId.tsx` |
| PATCH  | `/api/admin/menus/{id}/toggle` | `useToggleMenu` | `admin.menus.index.tsx` |
| DELETE | `/api/admin/menus/{id}` | `useDeleteMenu` | `admin.menus.index.tsx` |
| POST   | `/api/admin/menus/{menuId}/items/{itemId}` | `useAddItemToMenu` | `admin.menus.$menuId.tsx` |
| DELETE | `/api/admin/menus/{menuId}/items/{itemId}` | `useRemoveItemFromMenu` | `admin.menus.$menuId.tsx` |
| PATCH  | `/api/admin/menus/{menuId}/items/reorder` | `useReorderMenuItems` | `admin.menus.$menuId.tsx` |

---

### 10e. Menu Items

| Method | Endpoint | Hook | Admin Page(s) |
|--------|----------|------|--------------|
| GET    | `/api/admin/menu-items` | `useAdminMenuItems` | `admin.menu.index.tsx`, `admin.menu.new.tsx`, `admin.menu.$itemId.tsx`, `admin.menus.$menuId.tsx` |
| POST   | `/api/admin/menu-items` | `useCreateMenuItem` | `admin.menu.new.tsx` |
| PUT    | `/api/admin/menu-items/{id}` | `useUpdateMenuItem` | `admin.menu.$itemId.tsx` |
| PATCH  | `/api/admin/menu-items/{id}/prices` | `useUpdateMenuItemPrices` | `admin.menu.$itemId.tsx` |
| DELETE | `/api/admin/menu-items/{id}` | `useDeleteMenuItem` | `admin.menu.index.tsx` |

**Notes**
- Menus and Menu Items are split into two separate admin sections but share data.
  - `/api/admin/menus` — manages categories (the containers).
  - `/api/admin/menu-items` — manages individual dishes.
  - Linking a dish to a category: `POST /api/admin/menus/{menuId}/items/{itemId}`.
- `useAdminMenuItems` is called on 4 pages — including `admin.menus.$menuId.tsx` which needs the full item list to add/remove items from a category.
- Bilingual fields stored in DB: `Name`/`NameDa`, `Description`/`DescriptionDa` per item and per category.

---

### 10f. Offers

| Method | Endpoint | Hook | Admin Page(s) |
|--------|----------|------|--------------|
| GET    | `/api/admin/offers` | `useAdminOffers` | `admin.offers.index.tsx`, `admin.offers.new.tsx`, `admin.offers.$offerId.tsx` |
| POST   | `/api/admin/offers` | `useCreateOffer` | `admin.offers.new.tsx` |
| PUT    | `/api/admin/offers/{id}` | `useUpdateOffer` | `admin.offers.$offerId.tsx` |
| PATCH  | `/api/admin/offers/{id}/toggle` | `useToggleOffer` | `admin.offers.index.tsx` |
| DELETE | `/api/admin/offers/{id}` | `useDeleteOffer` | `admin.offers.index.tsx` |

---

### 10g. Branches (Admin CRUD)

| Method | Endpoint | Hook | Admin Page(s) |
|--------|----------|------|--------------|
| GET    | `/api/admin/branches` | `useAdminBranches` | `admin.branches.index.tsx`, `admin.branches.new.tsx`, `admin.branches.$branchId.tsx` |
| POST   | `/api/admin/branches` | `useCreateBranch` | `admin.branches.new.tsx` |
| PUT    | `/api/admin/branches/{id}` | `useUpdateBranch` | `admin.branches.$branchId.tsx` |

**Notes**
- Separate from the public `GET /api/locations` (`useBranches`).
- Admin branch endpoints return richer data (edit fields, all settings).
- No DELETE — branches are permanent business locations.

---

### 10h. Customers (Admin)

| Method | Endpoint | Hook | Admin Page |
|--------|----------|------|-----------|
| GET | `/api/admin/customers?q=&page=` | `useAdminCustomers` | `admin.customers.tsx` |
| GET | `/api/admin/customers/{id}` | `useAdminCustomerDetail` | `admin.customers.tsx` (detail panel) |

---

### 10i. File Upload

| Method | Endpoint | Hook | Admin Page(s) |
|--------|----------|------|--------------|
| POST | `/api/admin/upload/image` | `useUploadImage` | `admin.menu.new.tsx`, `admin.menu.$itemId.tsx`, `admin.menus.new.tsx`, `admin.menus.$menuId.tsx`, `admin.offers.new.tsx`, `admin.offers.$offerId.tsx`, `admin.branches.new.tsx`, `admin.branches.$branchId.tsx` |

**Notes**
- Files are saved to `wwwroot/images/menu-items/` on the server with a GUID filename.
- Allowed types: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`. Max size: 10 MB.
- Returns `{ url: "/images/menu-items/{guid}.ext" }` — the URL is then stored in the record.

---

## Summary

### By the numbers

| Category | Count |
|----------|-------|
| Total distinct endpoints | 38 |
| Public (🌐) | 14 |
| Auth-required public (🔐) | 7 |
| Admin-only (🛡️) | 17 |
| Total frontend hooks | 45 |
| Routes that call ≥1 hook | 30+ |

### Endpoints without a dedicated hook (direct `apiFetch`)

| Endpoint | Location |
|----------|----------|
| `POST /api/auth/register` | `AuthContext` |
| `POST /api/auth/login` | `AuthContext` |
| `GET /api/auth/me` | `AuthContext` |
| `POST /api/auth/forgot-password` | inline in auth page |
| `POST /api/auth/reset-password` | inline in auth page |
| `POST /api/contact` | `contact.tsx` submit handler |
| `GET /api/reservations/check-duplicate` | `reservation.tsx`, `locations.tsx` |

### Endpoints shared between public and admin

| Endpoint | Hook | Why shared |
|----------|------|-----------|
| `GET /api/locations` | `useBranches` | Admins need branch list for dropdowns (orders, reservations, menu assignment); public needs it for booking/display |

### Known gaps / future work

| Gap | Detail |
|-----|--------|
| `PublicOfferDto` has no `*Da` fields | Offer titles/descriptions are English-only from the API; backend needs `TitleDa`, `DescriptionDa` columns and DTO fields |
| `BranchDto` has no `*Da` fields | Branch names and opening hours are English-only; low priority (proper nouns don't translate) |
| No admin DELETE for branches | Intentional — branches are permanent locations; archiving would require a soft-delete flag |
| `GET /api/admin/customers/{id}` | Not a standalone hook file — defined inline alongside `useAdminCustomers` |
