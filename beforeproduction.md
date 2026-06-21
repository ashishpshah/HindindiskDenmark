# Before Production — Hind Indisk Restaurant
**Created:** 2026-06-21  
**Based on:** Full codebase review (code_review_findings.md)  
**Current state:** Development-complete, not production-ready

---

## OVERVIEW

Six phases must be completed before this application can accept real customers and real money. Each phase is a prerequisite for the next where indicated. Phases A and B can be done in parallel; Phases C–F must follow in order.

```
Phase A: Security & Config     ─┐
Phase B: Bug Fixes              ├─► Phase C: Order Fulfillment ──► Phase D: Payments
                                ─┘
                                      Phase E: Notifications (parallel with D)
                                      Phase F: Infrastructure & Deployment (last)
```

---

## PHASE A — Security & Configuration Hardening
**Priority:** Blocker — do before any deployment  
**Effort:** ~1 day

### A1. Move JWT secret out of source control
**File:** `backend/HindIndisk.Api/appsettings.json`

Remove the hardcoded placeholder secret. Use .NET User Secrets locally and environment variables in all deployed environments.

```bash
# Local development
dotnet user-secrets init
dotnet user-secrets set "Jwt:Secret" "your-min-32-char-production-secret"
```

`appsettings.json` should contain only a safe placeholder comment:
```json
"Jwt": {
  "Secret": "",        // set via env: Jwt__Secret
  "Issuer": "HindIndiskApi",
  "Audience": "HindIndiskClient",
  "ExpiryMinutes": 60
}
```

In deployment: set environment variable `Jwt__Secret` (double-underscore = nested config in .NET).

---

### A2. Restrict Swagger to development only
**File:** `backend/HindIndisk.Api/Program.cs`

```csharp
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Hind Indisk API v1"));
}
```

---

### A3. Environment-specific CORS origins
**File:** `backend/HindIndisk.Api/appsettings.json` + deployment config

`appsettings.json` stays as localhost for development:
```json
"AllowedOrigins": [ "http://localhost:3000" ]
```

Add production config via environment variable or `appsettings.Production.json`:
```json
"AllowedOrigins": [ "https://hindindisk.dk", "https://www.hindindisk.dk" ]
```

---

### A4. Remove hardcoded admin credentials from UI
**File:** `src/routes/admin.index.tsx`

Delete the Quick Links card block that renders:
```
Login credentials: admin@hindindisk.dk / Admin@123
```

This text is compiled into the JavaScript bundle and visible to anyone.

---

### A5. Add rate limiting to authentication endpoints
**File:** `backend/HindIndisk.Api/Program.cs`, `AuthController.cs`

Install `AspNetCoreRateLimit` or use .NET 7+ built-in rate limiting:

```csharp
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("auth", opt =>
    {
        opt.PermitLimit         = 10;
        opt.Window              = TimeSpan.FromMinutes(1);
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit          = 0;
    });
});
```

Apply to `AuthController`:
```csharp
[EnableRateLimiting("auth")]
[HttpPost("login")]
public async Task<IActionResult> Login(...) { ... }

[EnableRateLimiting("auth")]
[HttpPost("register")]
public async Task<IActionResult> Register(...) { ... }
```

---

### A6. Shorten JWT expiry + add 401 auto-logout on frontend
**Files:** `appsettings.json`, `src/lib/api/client.ts`, `src/context/AuthContext.tsx`

Reduce from 1440 minutes (24h) to 60 minutes in production config.

In `apiFetch`, detect 401 and fire a logout event:
```ts
if (res.status === 401) {
  localStorage.removeItem("hind-token");
  localStorage.removeItem("hind-user");
  window.dispatchEvent(new Event("hind:session-expired"));
  throw new Error("Your session has expired. Please log in again.");
}
```

In `AuthContext`, listen and auto-logout:
```ts
useEffect(() => {
  const handler = () => { persist(null); openModal("login"); };
  window.addEventListener("hind:session-expired", handler);
  return () => window.removeEventListener("hind:session-expired", handler);
}, []);
```

---

## PHASE B — Critical Bug Fixes
**Priority:** Blocker — several features are broken  
**Effort:** ~1 day  
**Can run parallel with Phase A**

### B1. Fix `apiFetch` crashing on 204 No Content
**File:** `src/lib/api/client.ts`

Current code always calls `res.json()` which throws on empty bodies (DELETE returns 204).

```ts
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  // ... existing token/header setup ...
  const res = await fetch(`${BASE}${path}`, { ...init, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((body as { message?: string }).message ?? res.statusText);
  }

  // FIX: don't parse empty bodies
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}
```

---

### B2. Fix React Fragment key warnings in admin tables
**Files:** `src/routes/admin.customers.tsx`, `src/routes/admin.menu.tsx`

Replace bare `<>` with `<React.Fragment key={...}>` in all `.map()` calls that render multiple `<tr>` rows per item:

```tsx
import React from "react";

{customers.map((c) => (
  <React.Fragment key={c.id}>
    <tr>...</tr>
    {expanded === c.id && <tr>...</tr>}
  </React.Fragment>
))}
```

---

### B3. Fix `OrdersController.UserId` null-forgiving operator
**File:** `backend/HindIndisk.Api/Controllers/OrdersController.cs`

Replace:
```csharp
private long UserId =>
    long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
```

With:
```csharp
private long GetUserId()
{
    var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!long.TryParse(raw, out var id))
        throw new UnauthorizedAccessException("Invalid token claims.");
    return id;
}
```

Update all three action methods to call `GetUserId()`.

---

### B4. Fix `UpdateOfferAsync` not updating `OfferType`
**File:** `backend/HindIndisk.Api/Application/Services/AdminService.cs`

Add the missing `OfferType` update:
```csharp
offer.OfferType  = string.IsNullOrWhiteSpace(request.CouponCode) ? "Direct" : "Coupon";
offer.CouponCode = string.IsNullOrWhiteSpace(request.CouponCode)
    ? null
    : request.CouponCode.Trim().ToUpper();
```

---

### B5. Fix hardcoded address count in account dashboard
**File:** `src/routes/account.index.tsx`

```tsx
const { data: addresses = [] } = useAddresses(!!user);

const cards = [
  // ...
  { to: "/account/addresses", label: "Addresses", icon: MapPin, value: addresses.length },
];
```

---

### B6. Remaining quick fixes

| Fix | File | Change |
|---|---|---|
| Phone clearing via empty string | `AuthService.cs` | `user.Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone;` |
| Checkout step 1 branch guard | `checkout.tsx` | Add `if (step === 1 && !currentBranchId)` guard in `next()` |
| `OutForDelivery` display label | `admin.orders.tsx` | Add `STATUS_LABELS` map, render `STATUS_LABELS[o.status] ?? o.status` |
| Debounce customer search | `admin.customers.tsx` | 300ms `useEffect` debounce before querying |
| `staleTime` on static queries | `useBranches`, `useMenuItems`, `useMenuCategories`, `usePublicOffers` | Add `staleTime: 10 * 60 * 1000` |

---

## PHASE C — Order Fulfillment Data
**Priority:** Blocker — delivery orders are placed with no delivery address  
**Effort:** ~2 days  
**Requires:** Phases A and B complete

Currently, checkout steps 3 (contact) and 4 (delivery address) collect data that is never stored. A staff member processing a delivery order has no address to deliver to.

### C1. Add contact and delivery fields to `Order` entity

**New migration required.** Add to `Order` entity:

```csharp
public string ContactName  { get; set; } = string.Empty;
public string ContactPhone { get; set; } = string.Empty;
public string ContactEmail { get; set; } = string.Empty;
public string? DeliveryAddressLine { get; set; }
public string? DeliveryCity        { get; set; }
public string? DeliveryPostalCode  { get; set; }
```

Run:
```bash
dotnet ef migrations add AddOrderContactAndDeliveryFields
dotnet ef database update
```

---

### C2. Add fields to `CreateOrderRequest` DTO and update `OrderService`

```csharp
public class CreateOrderRequest
{
    // existing fields ...
    [Required, MaxLength(100)] public string ContactName  { get; set; } = string.Empty;
    [Required, MaxLength(20)]  public string ContactPhone { get; set; } = string.Empty;
    [Required, MaxLength(150)] public string ContactEmail { get; set; } = string.Empty;
    [MaxLength(200)] public string? DeliveryAddressLine { get; set; }
    [MaxLength(50)]  public string? DeliveryCity        { get; set; }
    [MaxLength(20)]  public string? DeliveryPostalCode  { get; set; }
}
```

Map to `Order` in `OrderService.CreateOrderAsync`.

---

### C3. Add validation — delivery orders must include address

In `OrderService.CreateOrderAsync`:
```csharp
if (request.OrderType == "Delivery" &&
    string.IsNullOrWhiteSpace(request.DeliveryAddressLine))
    throw new InvalidOperationException("Delivery address is required for delivery orders.");
```

---

### C4. Wire checkout frontend to send contact fields

**File:** `src/routes/checkout.tsx` — include `details` in the `createOrder.mutateAsync(...)` call:

```ts
const order = await createOrder.mutateAsync({
  branchId:            currentBranchId,
  orderType:           orderType === "delivery" ? "Delivery" : "Pickup",
  couponCode:          coupon ?? undefined,
  items:               orderItems,
  contactName:         details.name,
  contactPhone:        details.phone,
  contactEmail:        details.email,
  deliveryAddressLine: orderType === "delivery" ? details.street : undefined,
  deliveryCity:        orderType === "delivery" ? details.city   : undefined,
  deliveryPostalCode:  orderType === "delivery" ? details.postal : undefined,
});
```

---

### C5. Show delivery address in admin orders table

**File:** `src/routes/admin.orders.tsx` — add an expandable row or tooltip showing the delivery address for delivery orders.

---

### C6. Fix cart coupon validation to allow API-created coupons

**File:** `src/context/CartContext.tsx`

Remove the local `COUPONS` constant. Replace `applyCoupon` with an API call to validate against the database, or remove client-side validation entirely and let the server reject invalid coupons at order time:

```ts
// Option 1: Remove client validation — server validates on place()
const applyCoupon = useCallback((code: string) => {
  const up = code.trim().toUpperCase();
  if (up) { setCoupon(up); lsSet("hind-coupon", up); return true; }
  return false;
}, []);
```

The `createOrder` mutation will return a descriptive error from the server if the code is invalid/expired. Show that toast to the user.

---

## PHASE D — Payment Integration
**Priority:** Hard blocker — no money can be collected  
**Effort:** ~3–5 days  
**Requires:** Phase C complete (order must exist before payment)

### Recommended gateway: QuickPay (Danish) or Stripe (international)

**QuickPay** is the most common Danish gateway supporting MobilePay, Dankort, Visa, Mastercard. **Stripe** is easier to integrate and has excellent documentation but requires extra setup for MobilePay.

### D1. Backend — Payment service

Add a `PaymentService` and `PaymentsController`:

```
POST /api/payments/create-intent   — create a payment session for an order
POST /api/payments/webhook         — receive payment confirmation from gateway
```

Flow:
1. After step 5 (payment method selection), frontend calls `POST /api/payments/create-intent` with `orderId` and `paymentMethod`
2. Backend creates a payment session with the gateway, returns a `checkoutUrl` or `clientSecret`
3. Frontend redirects to gateway checkout page OR renders embedded payment form
4. Gateway calls `POST /api/payments/webhook` on success/failure
5. Webhook handler updates `Order.Status` from `Placed` → `Accepted` and sets `Order.PaymentStatus = "Paid"`

### D2. Add `PaymentStatus` to `Order` entity

```csharp
public string PaymentStatus { get; set; } = "Pending"; // Pending | Paid | Failed | Refunded
public string? PaymentReference { get; set; }          // gateway transaction ID
```

New migration required.

### D3. Frontend — Replace mock payment step

Replace the static payment method buttons in checkout step 5 with either:
- An embedded Stripe Elements form (`@stripe/react-stripe-js`)
- A redirect to the QuickPay hosted payment page

The success callback navigates to order tracking (existing flow works).

### D4. Secure the webhook endpoint

```csharp
[HttpPost("webhook")]
[AllowAnonymous]  // called by payment gateway, not by the user
public async Task<IActionResult> Webhook()
{
    // Verify gateway signature header before processing
    // QuickPay: X-QuickPay-Checksum-Sha256
    // Stripe: Stripe-Signature
}
```

---

## PHASE E — Email Notifications
**Priority:** High — customers have no confirmation records  
**Effort:** ~2 days  
**Can run parallel with Phase D**

### Recommended service: SendGrid (free tier: 100 emails/day) or Postmark

### E1. Add email service

```csharp
public interface IEmailService
{
    Task SendOrderConfirmationAsync(string to, OrderDto order);
    Task SendReservationConfirmationAsync(string to, ReservationDto reservation);
    Task SendOrderStatusUpdateAsync(string to, long orderId, string status);
}
```

Implement using `SendGrid.Extensions.DependencyInjection` or `MailKit`.

### E2. Trigger emails at the right points

| Event | Email | Trigger location |
|---|---|---|
| Order placed | Order confirmation with items + total | `OrderService.CreateOrderAsync` |
| Order status changed | Status update | `AdminService.UpdateOrderStatusAsync` (for Accepted, Ready, OutForDelivery, Completed) |
| Reservation created | Booking confirmation with date/time/branch | `ReservationService.CreateReservationAsync` |
| Reservation confirmed/cancelled | Status update | `AdminService.UpdateReservationStatusAsync` |

### E3. Email templates

Create HTML email templates for each event. Minimum required fields:
- **Order confirmation:** Order #ID, items, subtotal, discount, tax, delivery fee, total, estimated time, branch address
- **Reservation confirmation:** Reservation #ID, branch, date, time, guest count, special requests

Store templates in `src/EmailTemplates/` as `.html` files or use a transactional email service's template editor.

### E4. Add `SENDGRID_API_KEY` (or equivalent) to secrets/environment variables

Never commit API keys. Same pattern as JWT secret — user secrets locally, environment variable in production.

---

## PHASE F — Infrastructure & Deployment
**Priority:** Required before go-live  
**Effort:** ~2–3 days  
**Requires:** Phases A–E complete

### F1. Choose and provision a database

**Replace `(localdb)\\MSSQLLocalDB`** with a production database:

| Option | Cost | Notes |
|---|---|---|
| Azure SQL (Basic) | ~€5/month | Best for .NET apps, managed backups, easy EF Core integration |
| Supabase (PostgreSQL) | Free tier available | Requires changing `UseSqlServer` → `UseNpgsql` in Program.cs |
| Railway (PostgreSQL/MySQL) | ~€5/month | Simple deployment, built-in env vars |

Update connection string via environment variable:
```
ConnectionStrings__Default=Server=yourserver.database.windows.net;...
```

---

### F2. Choose a hosting platform for the API

| Option | Notes |
|---|---|
| Azure App Service (Free/B1) | Best for .NET, easy env vars, auto-restart |
| Railway | Simple, deploy from GitHub, built-in DB option |
| Fly.io | Docker-based, great for .NET containers |

Add a `Dockerfile` to the backend:
```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY . .
RUN dotnet publish -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "HindIndisk.Api.dll"]
```

---

### F3. Add a health check endpoint

```csharp
// Program.cs
builder.Services.AddHealthChecks()
    .AddDbContextCheck<ApplicationDbContext>();

app.MapHealthChecks("/health");
```

Used by hosting platforms for liveness/readiness probes and uptime monitoring.

---

### F4. Choose hosting for the frontend

The frontend builds to static files (`dist/client/`). Any static host works:

| Option | Notes |
|---|---|
| Cloudflare Pages | Free, fast global CDN, already targeted by Nitro config |
| Vercel | Free tier, automatic deployments from GitHub |
| Azure Static Web Apps | Free tier, integrates well with Azure API |

Set `VITE_API_URL` to point to the deployed API:
```
VITE_API_URL=https://api.hindindisk.dk
```

---

### F5. Configure production CORS

Once the frontend domain is known (e.g., `https://hindindisk.dk`):
```json
"AllowedOrigins": ["https://hindindisk.dk", "https://www.hindindisk.dk"]
```

Set via environment variable `AllowedOrigins__0` and `AllowedOrigins__1` in production.

---

### F6. Add structured logging + error monitoring

**Sentry** (free tier: 5000 errors/month) is the quickest win:

```csharp
// Backend
builder.WebHost.UseSentry(options =>
{
    options.Dsn = builder.Configuration["Sentry:Dsn"];
    options.TracesSampleRate = 0.1;
});
```

```ts
// Frontend (Vite)
import * as Sentry from "@sentry/react";
Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN, tracesSampleRate: 0.1 });
```

---

### F7. Set up CI/CD pipeline (optional but strongly recommended)

A minimal GitHub Actions workflow:

```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main]

jobs:
  build-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with: { dotnet-version: "8.0" }
      - run: dotnet build backend/HindIndisk.Api
      - run: dotnet test backend/  # if tests exist

  build-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20" }
      - run: npm ci && npm run build
```

---

## PRODUCTION CHECKLIST

Before flipping the switch on a real domain:

### Security
- [ ] JWT secret is an env variable, not in source code
- [ ] Swagger is disabled in production
- [ ] Rate limiting on `/api/auth/login` and `/api/auth/register`
- [ ] Admin credentials removed from UI
- [ ] CORS restricted to production domain only
- [ ] HTTPS enforced (TLS certificate provisioned)
- [\] Payment webhook signature verified - No need

### Functionality
- [ ] Delivery orders store contact name, phone, email, address
- [\] Real payment gateway integrated and tested end-to-end - No need
- [\] Order confirmation email sends after successful payment - Config from appsetting.json - Google
- [ ] Reservation confirmation email sends after booking
- [ ] Order status update emails send from admin panel
- [ ] Coupon validation works for all coupons (not just hardcoded 3)

### Infrastructure
- [\] Production database provisioned (not LocalDB) - Use MS SQL Server - config manually
- [ ] Database backups configured
- [ ] Health check endpoint returning 200
- [ ] Environment variables set for all secrets (JWT, DB connection string, payment key, email key, Sentry DSN)
- [ ] `VITE_API_URL` set to production API domain
- [\] Frontend deploys to CDN - No need
- [ ] 401 auto-logout working in browser

### Operations
- [ ] Error monitoring active (Sentry or equivalent)
- [ ] Structured logs accessible
- [ ] Admin user password changed from `Admin@123`
- [ ] Test order placed end-to-end with cod payment on staging

---

## EFFORT SUMMARY

| Phase | Description | Effort | Blocks |
|---|---|---|---|
| A | Security & Config | ~1 day | Phases B–F |
| B | Critical Bug Fixes | ~1 day | Phase C |
| C | Order Fulfillment Data | ~2 days | Phase D |
| D | Payment Integration | ~3–5 days | Go-live |
| E | Email Notifications | ~2 days | (parallel with D) |
| F | Infrastructure & Deployment | ~2–3 days | Go-live |
| **Total** | | **~11–14 days** | |

Current codebase is approximately **70% production-ready**. The architecture, auth, data model, and admin tooling are all solid. The remaining 30% is operational completeness — payments, emails, real infrastructure, and the order fulfillment data gap.
