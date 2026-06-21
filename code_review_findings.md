# Hind Indisk — Full Codebase Review
**Date:** 2026-06-20  
**Scope:** Full-stack (.NET 8 API + React/TanStack Start frontend), Phases 1–9  
**Reviewer:** Claude Code

---

## TABLE OF CONTENTS

1. [Critical Bugs](#1-critical-bugs)
2. [Security Issues](#2-security-issues)
3. [Logic / Data Bugs](#3-logic--data-bugs)
4. [UX / Feature Gaps](#4-ux--feature-gaps)
5. [Code Quality](#5-code-quality)
6. [Performance](#6-performance)
7. [Positive Findings](#7-positive-findings)
8. [Recommended Action Plan](#8-recommended-action-plan)

---

## 1. CRITICAL BUGS

These will cause runtime errors or data loss.

---

### 1.1 `apiFetch` crashes on 204 No Content (DELETE responses)

**File:** `src/lib/api/client.ts:27`  
**Severity:** Critical — breaks "Delete Address" entirely

`apiFetch` always calls `res.json()` at the end, regardless of HTTP status code. The `DELETE /api/addresses/{id}` endpoint returns `204 No Content` (no body). Calling `.json()` on an empty body throws `SyntaxError: Unexpected end of JSON input` at the call site.

**Current code:**
```ts
if (!res.ok) { ... }
return res.json() as Promise<T>;  // throws on 204
```

**Fix:**
```ts
if (res.status === 204 || res.headers.get("content-length") === "0") {
  return undefined as T;
}
return res.json() as Promise<T>;
```

Alternatively, have the `DELETE` endpoint return `Ok(new {})` instead of `NoContent()`, but the correct HTTP semantic is 204, so fix the client.

---

### 1.2 React Fragment key warnings in admin tables

**Files:** `src/routes/admin.customers.tsx:55`, `src/routes/admin.menu.tsx:79`  
**Severity:** High — React will produce key warnings and may exhibit rendering glitches

Both files use bare `<>...</>` fragments inside `.map()` calls, which cannot accept a `key` prop. The inner `<tr>` has a key but the outer fragment does not.

**Current (admin.customers.tsx):**
```tsx
{customers.map((c) => (
  <>
    <tr key={c.id}>...</tr>
    {expanded === c.id && <tr key={`${c.id}-detail`}>...</tr>}
  </>
))}
```

**Fix:** Replace `<>` with `<React.Fragment key={c.id}>`:
```tsx
import React from "react";
{customers.map((c) => (
  <React.Fragment key={c.id}>
    <tr>...</tr>
    {expanded === c.id && <tr>...</tr>}
  </React.Fragment>
))}
```
Apply the same pattern in `admin.menu.tsx`.

---

### 1.3 `OrdersController.UserId` will throw NullReferenceException

**File:** `backend/HindIndisk.Api/Controllers/OrdersController.cs:18`  
**Severity:** High — unhandled exception leaks 500 instead of 401

```csharp
private long UserId =>
    long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
```

The `!` operator silences the nullable warning. If the claim is missing (e.g., a malformed token), `FindFirstValue` returns `null`, `!` suppresses the warning, and `long.Parse(null)` throws `ArgumentNullException`. This becomes a 500, not a 401.

**Fix:** Follow the same pattern used in `AuthController` and `AddressesController`:
```csharp
private long GetUserId()
{
    var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!long.TryParse(raw, out var id))
        throw new UnauthorizedAccessException();
    return id;
}
```
Then use `GetUserId()` inside each action — and add a global handler that converts `UnauthorizedAccessException` to 401.

---

## 2. SECURITY ISSUES

---

### 2.1 JWT secret committed to source control

**File:** `backend/HindIndisk.Api/appsettings.json:6`  
**Severity:** High (production blocker)

```json
"Secret": "REPLACE_WITH_MIN_32_CHAR_SECRET_KEY_HERE_1234"
```

This placeholder secret is committed to the repository. Any developer or CI agent who clones the repo can sign arbitrary JWTs for any user/role.

**Fix:**
- Use .NET User Secrets for development: `dotnet user-secrets set "Jwt:Secret" "your-real-secret"`
- Use environment variables or a secrets manager (Azure Key Vault, AWS Secrets Manager) for production
- Remove the placeholder value from `appsettings.json` entirely — fail fast with `throw new InvalidOperationException` if it is missing (already done correctly on line 17, which is good)

---

### 2.2 Swagger UI unconditionally enabled

**File:** `backend/HindIndisk.Api/Program.cs:129–133`  
**Severity:** Medium

The `if (app.Environment.IsDevelopment())` block was commented out, exposing Swagger UI in any environment including production:
```csharp
// if (app.Environment.IsDevelopment())
// {
    app.UseSwagger();
    app.UseSwaggerUI(...);
// }
```
This exposes your full API surface, request/response shapes, and auth scheme to anyone who finds `/swagger`.

**Fix:** Uncomment the guard, or use a config flag:
```csharp
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(...);
}
```

---

### 2.3 Admin credentials displayed in the production UI

**File:** `src/routes/admin.index.tsx:88–89`  
**Severity:** Medium

The admin dashboard Quick Links card hardcodes login credentials in the rendered HTML:
```tsx
Login credentials: <code>admin@hindindisk.dk</code> / <code>Admin@123</code>
```

Anyone who reaches the admin panel (or inspects the JS bundle) can read these. If the admin password is ever changed, this text will become stale and misleading.

**Fix:** Remove this block entirely. It's a dev note, not production content.

---

### 2.4 JWT stored in `localStorage` (XSS risk)

**File:** `src/lib/api/client.ts:4–9`, `src/context/AuthContext.tsx:64`  
**Severity:** Low-Medium (acceptable for demo, not for production)

Storing JWTs in `localStorage` exposes them to any JavaScript running on the page, including injected XSS payloads. An attacker who achieves XSS can read the token and impersonate the user.

**Recommendation for production:** Use `httpOnly` cookies set by the API server instead of localStorage. The browser will automatically attach them, they're not readable by JS, and CORS + SameSite protect against CSRF. This requires adding a `/api/auth/refresh` cookie endpoint.

---

### 2.5 No automatic logout on 401 / token expiry

**File:** `src/lib/api/client.ts`, `src/context/AuthContext.tsx`  
**Severity:** Medium — poor UX and soft security gap

JWTs expire after 1440 minutes (24 hours, per `appsettings.json`). When a token expires, all API calls silently fail with a thrown `Error`. The user sees loading spinners or "Could not load" error states with no explanation and no automatic redirect to login.

**Fix:** Add a response interceptor in `apiFetch`:
```ts
if (res.status === 401) {
  // Clear token and user from localStorage
  localStorage.removeItem("hind-token");
  localStorage.removeItem("hind-user");
  // Optionally fire a custom event that AuthContext listens to
  window.dispatchEvent(new Event("hind:auth-expired"));
  throw new Error("Session expired. Please log in again.");
}
```
In `AuthContext`, listen to `"hind:auth-expired"` and call `persist(null)` + open the login modal.

---

## 3. LOGIC / DATA BUGS

---

### 3.1 Checkout contact details never reach the backend

**File:** `src/routes/checkout.tsx:84–96`  
**Severity:** High — order fulfillment is incomplete

Steps 3 and 4 of checkout collect name, phone, email, and delivery address. None of this is included in `CreateOrderRequest`:

```ts
const order = await createOrder.mutateAsync({
  branchId:   currentBranchId,
  orderType:  orderType === "delivery" ? "Delivery" : "Pickup",
  couponCode: coupon ?? undefined,
  items:      orderItems,
  // name, phone, email, street, city, postal — NEVER SENT
});
```

The API also has no fields for contact/delivery details on `CreateOrderRequest` or the `Order` entity. A delivery order is placed with no delivery address stored anywhere.

**Fix (short-term):** Add `contactName`, `contactPhone`, `contactEmail`, `deliveryAddress` fields to `CreateOrderRequest` DTO and the `Order` entity, include a migration, and wire them into the checkout payload. Medium effort — requires backend schema change + new migration.

**Fix (minimal):** At least store delivery address info in the `Order` entity's existing or new optional string fields so the admin knows where to deliver.

---

### 3.2 Cart coupon validation uses hardcoded local list

**File:** `src/context/CartContext.tsx:53–57`  
**Severity:** Medium — new offers created via admin panel won't be accepted at cart UI level

```ts
const COUPONS: Record<string, { type: "percent" | "freeDelivery"; value: number }> = {
  WELCOME10: { type: "percent", value: 10 },
  FAMILY20:  { type: "percent", value: 20 },
  FREEDELIVERY: { type: "freeDelivery", value: 0 },
};
```

If an admin creates a new coupon (e.g., `SUMMER30`) via the Offers admin page, the cart drawer will reject it with "Invalid coupon" because it's not in this local map. The API correctly validates at order creation time — so the order would still be placed successfully if the user somehow bypassed the cart UI — but the UX is broken.

**Fix:** Replace `applyCoupon` with an API call:
```ts
// Hit GET /api/offers/validate?code=SUMMER30 (new endpoint needed)
// Or simply attempt to apply and let the API reject at order time
// Remove client-side validation entirely — only show "invalid" if the API rejects it
```
Simplest fix: remove the cart-drawer coupon validation entirely; validate only on `place()` via the existing server-side check. Show a toast if `createOrder` fails with a coupon error.

---

### 3.3 Addresses card in account dashboard shows hardcoded count "1"

**File:** `src/routes/account.index.tsx:24`  
**Severity:** Low — incorrect data displayed to user

```ts
{ to: "/account/addresses", label: "Addresses", icon: MapPin, value: 1 },
```

This always shows "1" regardless of how many addresses the user has saved.

**Fix:**
```ts
const { data: addresses = [] } = useAddresses(!!user);
// ...
{ to: "/account/addresses", label: "Addresses", icon: MapPin, value: addresses.length },
```

---

### 3.4 Clearing phone number is impossible via `UpdateProfileAsync`

**File:** `backend/HindIndisk.Api/Application/Services/AuthService.cs:78`  
**Severity:** Low — data can only grow, never shrink

```csharp
user.Phone = request.Phone ?? user.Phone;
```

If a user wants to remove their phone number, they send `Phone: null`, but the null-coalescing keeps the old value. The phone is permanently "sticky".

**Fix:** Distinguish between "not provided" (leave as-is) and "explicitly cleared" (set to null). Options:
- Accept empty string as "clear": `user.Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone;`
- Use a nullable `string?` in the request DTO with a separate "included" flag

---

### 3.5 DataSeeder partial-seed failure leaves DB in broken state

**File:** `backend/HindIndisk.Api/Infrastructure/DataSeeder.cs:44`  
**Severity:** Low — only affects initial setup

The re-entry guard is:
```csharp
if (await context.Menus.AnyAsync()) return;
```

If the seeder runs, seeds `Menus`, but then crashes before seeding `MenuItems`, subsequent restarts will skip the whole block because `Menus` is non-empty. The DB will be left with categories but no items, prices, or offers.

**Fix:** Use a transaction around the entire seed block, or check `context.MenuItems.AnyAsync()` (the last table seeded) as the guard condition, or wrap each section in its own idempotent check:
```csharp
if (!await context.MenuItems.AnyAsync()) { /* seed items */ }
if (!await context.Branches.AnyAsync())  { /* seed branches */ }
// etc.
```

---

## 4. UX / FEATURE GAPS

---

### 4.1 Checkout Step 1 has no branch selection guard

**File:** `src/routes/checkout.tsx:63–75`  
**Severity:** Medium

`next()` has guards for steps 3 (contact) and 4 (address) but not step 1 (branch). If `branchesData` is empty or still loading, a user can advance from step 1 without a branch being set. `currentBranchId` will be `undefined` and the order will fail only at the final "Place Order" step.

**Fix:**
```ts
const next = () => {
  if (step === 1 && !currentBranchId) {
    toast.error("Please select a branch.");
    return;
  }
  // ... existing step 2, 3, 4 guards
};
```

---

### 4.2 `OutForDelivery` status displays raw in admin orders table

**File:** `src/routes/admin.orders.tsx:17`  
**Severity:** Low — cosmetic only

`ORDER_STATUSES` includes `"OutForDelivery"` (one word) because that's what the API uses. The badge renders this as-is: `OutForDelivery`. A customer-facing label of "Out For Delivery" would be more readable.

**Fix:** Add a display-name map alongside `STATUS_COLORS`:
```ts
const STATUS_LABELS: Record<string, string> = {
  OutForDelivery: "Out For Delivery",
};
// then: STATUS_LABELS[o.status] ?? o.status
```

---

### 4.3 No token/session refresh mechanism

**File:** `backend/HindIndisk.Api/appsettings.json:9`, `src/context/AuthContext.tsx`  
**Severity:** Medium — users silently lose access after 24h

After the 1440-minute JWT lifetime, the user is still "logged in" per `localStorage` but all API calls return 401. There is no refresh token, no token renewal endpoint, and no client-side handler to detect expiry (see Security §2.5 for the detection fix).

**Fix (minimal):** Shorten the JWT to e.g. 60 minutes and add a `POST /api/auth/refresh` endpoint that accepts the current (valid) token and returns a new one. The `apiFetch` interceptor calls this automatically when it sees a 401 during active use.

---

### 4.4 Reservation page has no error UX when submission fails

**File:** `src/routes/reservation.tsx:50–68`  
**Severity:** Low — `isError` is shown but no try/catch

`handleSubmit` has no try/catch. A network error will propagate as an unhandled rejection. `createReservation.isError` is displayed below the button, which handles the visual feedback, but a generic "Something went wrong" without context about what failed is minimal. Consider showing `createReservation.error?.message` from the API response.

---

### 4.5 Admin customers search fires immediately on each keystroke

**File:** `src/routes/admin.customers.tsx:15`  
**Severity:** Low — performance and UX

```ts
const { data: customers = [], isLoading } = useAdminCustomers(search || undefined);
```

Every keystroke triggers a new API call. For a small dataset this is fine, but it should be debounced:

```ts
const [search, setSearch] = useState("");
const [debouncedSearch, setDebouncedSearch] = useState("");

useEffect(() => {
  const t = setTimeout(() => setDebouncedSearch(search), 300);
  return () => clearTimeout(t);
}, [search]);

const { data: customers = [] } = useAdminCustomers(debouncedSearch || undefined);
```

---

### 4.6 Reservation date has no minimum today validation on mobile

**File:** `src/routes/reservation.tsx:104–108`  
**Severity:** Low

The date input has `min={new Date().toISOString().split("T")[0]}` which prevents selecting past dates on desktop browsers. However, the server-side `ReservationService` (and `ReservationsController`) doesn't validate that `Date >= today`. A past date can be submitted if the HTML validation is bypassed (e.g., via direct API call or browser dev tools).

**Fix:** Add server-side validation in `ReservationService.CreateReservationAsync`:
```csharp
if (request.Date.Date < DateTime.UtcNow.Date)
    throw new InvalidOperationException("Reservation date cannot be in the past.");
```

---

## 5. CODE QUALITY

---

### 5.1 Redundant `Content-Type` header in `useCreateOrder`

**File:** `src/hooks/useCreateOrder.ts:37–40`  
`apiFetch` already sets `Content-Type: application/json` by default. Passing it again in the `headers` object of `useCreateOrder` is harmless but redundant:
```ts
headers: { "Content-Type": "application/json" },  // remove this
```

---

### 5.2 `to: c.to as any` in account dashboard

**File:** `src/routes/account.index.tsx:37`  
The type assertion `to={c.to as any}` is a workaround for the dynamic route array. Since TanStack Router has strict route typing, the correct fix is to type the array with a union or cast at the point of construction. Minor but avoids the `any` spread.

---

### 5.3 `GetCustomersAsync` — `AsNoTracking()` after `Include()`

**File:** `backend/HindIndisk.Api/Application/Services/AdminService.cs:314`  
Style issue only — `AsNoTracking()` is placed after `Where(...)`. The recommended pattern is to chain it right after the `DbSet` call:
```csharp
_db.Users.AsNoTracking()
   .Include(u => u.Role)
   .Where(...)
```
No functional difference in EF Core 8, but more idiomatic.

---

### 5.4 Reservation date filtering via `.Date` property

**File:** `backend/HindIndisk.Api/Application/Services/AdminService.cs:92`  
```csharp
q = q.Where(r => r.Date.Date == parsedDate.Date);
```
EF Core translates `.Date` to `CAST([Date] AS date)` in SQL Server, which prevents index seeks on the `Date` column. For a small reservations table this is fine, but for scalability:
```csharp
var start = parsedDate.Date;
var end   = start.AddDays(1);
q = q.Where(r => r.Date >= start && r.Date < end);
```

---

### 5.5 `UpdateOffer` doesn't update `OfferType`

**File:** `backend/HindIndisk.Api/Application/Services/AdminService.cs:213–222`  
`CreateOfferAsync` correctly sets `OfferType = "Coupon"` or `"Direct"` based on whether a coupon code is present. But `UpdateOfferAsync` does not update `OfferType` when the coupon code is changed or cleared:
```csharp
offer.CouponCode = request.CouponCode?.Trim().ToUpper();
// OfferType is never updated here!
```

**Fix:**
```csharp
offer.OfferType  = string.IsNullOrWhiteSpace(request.CouponCode) ? "Direct" : "Coupon";
offer.CouponCode = string.IsNullOrWhiteSpace(request.CouponCode) ? null : request.CouponCode.Trim().ToUpper();
```

---

### 5.6 `useCreateOrder` doesn't invalidate `["order", id]`

**File:** `src/hooks/useCreateOrder.ts:43–45`  
After creating an order, only `["my-orders"]` is invalidated. If the user is currently on the order tracking page for an older order and places a new one, the order cache for specific IDs won't be updated. Minor edge case.

---

### 5.7 `apiFetch` error body parsing — double JSON parse failure risk

**File:** `src/lib/api/client.ts:22–24`  
```ts
const body = await res.json().catch(() => ({ message: res.statusText }));
throw new Error((body as { message?: string }).message ?? res.statusText);
```
This is solid. The `.catch()` handles non-JSON error bodies. No change needed — just confirming it's correct.

---

### 5.8 Cart `sub()` and `remove()` use name as key, not ID

**File:** `src/context/CartContext.tsx:96–101`  
```ts
const sub = useCallback((name: string) => { ... }, []);
const remove = useCallback((name: string) => { ... }, []);
```
Cart entries are keyed by `item.name` (a string). If two menu items had the same name (unlikely but possible if admin renames one), they would collide in the cart. Using `item.id` as the key would be more robust. The `add()` function also keys by `item.name`.

---

## 6. PERFORMANCE

---

### 6.1 No `staleTime` on any query — refetches on every mount

**Scope:** All hooks in `src/hooks/`  
Every query uses the default `staleTime: 0`, meaning React Query considers every cached result immediately stale and refetches on every component mount. For relatively static data this is wasteful:

| Query | Suggested staleTime |
|---|---|
| `useBranches` | 30 minutes |
| `useMenuItems` | 10 minutes |
| `useMenuCategories` | 30 minutes |
| `usePublicOffers` | 5 minutes |
| `useAdminDashboard` | (already uses `refetchInterval: 30_000`) |

**Fix example in `useBranches.ts`:**
```ts
return useQuery({
  queryKey: ["branches"],
  queryFn: () => apiFetch<BranchDto[]>("/api/locations/branches"),
  staleTime: 30 * 60 * 1000,
});
```

---

### 6.2 `GetMenuItemsAsync` loads all relations eagerly

**File:** `backend/HindIndisk.Api/Application/Services/AdminService.cs:117–127`  
For the admin menu table, every `MenuItem` loads its labels, mappings, and branch prices in a single query via `.Include()`. With 13 items this is fine, but as the menu grows this becomes a single large query. Consider projecting to a DTO directly with `.Select()` to avoid loading full navigation objects when only a few fields are needed.

---

### 6.3 Dashboard queries 5 separate `COUNT/SUM` calls

**File:** `backend/HindIndisk.Api/Application/Services/AdminService.cs:21–36`  
The dashboard makes 5 separate database round-trips. These could be combined into 2–3 queries or a stored procedure for high-traffic scenarios. Acceptable for the current scale.

---

## 7. POSITIVE FINDINGS

These are things done notably well.

---

### 7.1 Server-side price recalculation — client totals never trusted

`OrderService.CreateOrderAsync` recalculates all prices from the database regardless of what the client sends. Discount logic, delivery fee, and tax are all recomputed server-side. This is the correct pattern — no price manipulation is possible from the client.

### 7.2 Address IDOR protection

Both `UpdateAddressAsync` and `DeleteAddressAsync` filter `a.UserId == userId` before operating. An attacker cannot modify or delete another user's address by guessing an ID — they get a 404, which also avoids user enumeration.

### 7.3 Offer unique index with NULL filter

`ApplicationDbContext.cs` defines:
```csharp
modelBuilder.Entity<Offer>()
    .HasIndex(o => o.CouponCode)
    .IsUnique()
    .HasFilter("[CouponCode] IS NOT NULL");
```
This allows multiple "Direct" (auto-apply) offers with `CouponCode = null` without violating uniqueness.

### 7.4 Coupon usage limit enforced atomically

`OrderService` checks `UsageCount >= UsageLimit` and increments `UsageCount` in the same `SaveChanges` call. Under low concurrency this is sufficient. For true high-concurrency, a database-level optimistic concurrency token (`[ConcurrencyCheck]`) would prevent double-spends.

### 7.5 EF Core cascade rules are carefully configured

`ApplicationDbContext` uses `DeleteBehavior.Restrict` on all paths that would create multiple cascade routes (User→Orders, Branch→Orders, etc.), preventing the SQL Server "multiple cascade paths" error. `DeleteBehavior.Cascade` is only used for `Order→OrderItems` and `Order→AppliedOffers` (owned collections that have no meaning without the order).

### 7.6 Cart migration guard

`CartContext` correctly ignores old `Record<string, number>` entries:
```ts
if (typeof v === "object" && v !== null && "id" in v) { ... }
```
This provides seamless backward compatibility when upgrading an existing user's stored cart.

### 7.7 `useOrder` correctly guards API calls

`useOrder` uses `enabled: numericId !== null` — legacy order IDs (non-numeric, e.g., `HIN-XXXXXX`) never trigger an API call. The query is correctly gated.

### 7.8 Global exception handler in Program.cs

The middleware returns a consistent `{ message: "..." }` JSON for all unhandled 500s, which `apiFetch` correctly parses. No stack traces leak to the client.

### 7.9 `DataSeeder.SeedAsync` is idempotent

Each section is guarded by existence checks, and the admin user seeding uses `IDENTITY_INSERT` with proper connection management. Restarting the API never double-seeds.

---

## 8. RECOMMENDED ACTION PLAN

Prioritized by effort vs. impact:

### Immediate (fix now)

| # | Action | File(s) |
|---|---|---|
| A | Fix `apiFetch` 204 No Content crash | `src/lib/api/client.ts` |
| B | Fix React Fragment key warnings | `admin.customers.tsx`, `admin.menu.tsx` |
| C | Fix `OrdersController.UserId` null-forgiving operator | `OrdersController.cs` |
| D | Remove admin credentials from dashboard UI | `admin.index.tsx` |
| E | Fix `UpdateOfferAsync` not updating `OfferType` | `AdminService.cs` |

### Short-term (next sprint)

| # | Action | File(s) |
|---|---|---|
| F | Fix hardcoded "1" address count in account dashboard | `account.index.tsx` |
| G | Fix `UpdateProfileAsync` phone clearing logic | `AuthService.cs` |
| H | Move JWT secret to environment variable / user secrets | `appsettings.json` |
| I | Guard Swagger behind `IsDevelopment()` | `Program.cs` |
| J | Add 401 auto-logout in `apiFetch` | `src/lib/api/client.ts` |
| K | Add branch selection guard to checkout step 1 | `checkout.tsx` |
| L | Add status display-name map for `OutForDelivery` | `admin.orders.tsx` |
| M | Add past-date validation in `ReservationService` | `ReservationService.cs` |

### Medium-term (backlog)

| # | Action | File(s) |
|---|---|---|
| N | Add contact/delivery address fields to order creation | `CreateOrderRequest`, `Order` entity, checkout |
| O | Fix cart coupon validation to allow API-created coupons | `CartContext.tsx` |
| P | Add `staleTime` to static queries | All hook files |
| Q | Debounce customer search | `admin.customers.tsx` |
| R | Improve `DataSeeder` partial-failure resilience | `DataSeeder.cs` |
| S | Cart key: use item ID instead of name | `CartContext.tsx` |

### Nice-to-have

| # | Action |
|---|---|
| T | Token refresh endpoint (`POST /api/auth/refresh`) |
| U | Replace localStorage JWT with httpOnly cookies |
| V | Use `.Select()` projection in `GetMenuItemsAsync` instead of eager loading |
| W | Fix reservation date filtering to use range instead of `.Date` property |

---

## SUMMARY COUNTS

| Category | Count |
|---|---|
| Critical Bugs | 3 |
| Security Issues | 5 |
| Logic / Data Bugs | 5 |
| UX / Feature Gaps | 6 |
| Code Quality | 8 |
| Performance | 3 |
| **Total findings** | **30** |
