# Code Review — Hind Indisk Restaurant

---

## Finding 1 — Checkout Accepts Orders With Empty Required Fields

**Severity:** Critical
**Actionable:** Yes
**Category:** Bug
**Architecture:** Frontend

**Location:**
- File: `src/routes/checkout.tsx`
- Component: `CheckoutPage`
- Method: `next()`, `place()`
- Lines: 44–63

**Problem:**
Steps 3 (contact details) and 4 (delivery address) render `<Input required … />` elements, but the "Next" button is not inside a `<form>` element. The HTML `required` constraint only fires on form submission — it has no effect here. `next()` advances the step unconditionally and `place()` saves and confirms the order without checking whether any field has been filled.

**Impact:**
An order can be placed with a completely blank name, phone, email, and address. The order is written to `localStorage` and confirmed to the user. There is no way to contact the customer or deliver the order. Every delivery order placed without an address is unactionable.

**Recommendation:**
Wrap each step's fields in a `<form onSubmit={next}>` and move the "Next" / "Place Order" button inside it as `type="submit"`. Alternatively, add explicit guard validation in `next()`:
```ts
const next = () => {
  if (step === 3 && (!details.name || !details.phone || !details.email)) {
    toast.error("Please fill in all contact details.");
    return;
  }
  if (step === 4 && orderType === "delivery" && (!details.street || !details.city || !details.postal)) {
    toast.error("Please fill in your delivery address.");
    return;
  }
  setStep((s) => { ... });
};
```

---

## Finding 2 — Login Error Leaves Submit Button Permanently Disabled

**Severity:** High
**Actionable:** Yes
**Category:** Bug
**Architecture:** Frontend

**Location:**
- File: `src/components/AuthModal.tsx`
- Component: `AuthModal`
- Method: `onLogin`, `onRegister`
- Lines: 20–31

**Problem:**
`setLoading(true)` is called before `await login(...)` / `await register(...)`, but there is no `try/catch` or `finally` block. If the async call ever throws (e.g. when wired to a real API), `setLoading` is never set back to `false`. The submit button remains `disabled={loading}` indefinitely with no error message displayed.

**Impact:**
On the first failed login or registration attempt, the user can no longer submit the form without refreshing the page. Combined with no error feedback, they will not know whether their credentials were wrong or the service is down.

**Recommendation:**
Wrap each handler in `try/catch/finally`:
```ts
const onLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  try {
    await login(form.email, form.password);
    toast.success("Logged in");
    closeModal();
  } catch {
    toast.error("Invalid email or password.");
  } finally {
    setLoading(false);
  }
};
```

---

## Finding 3 — Order Tracking Uses Hard Navigation Instead of Router

**Severity:** High
**Actionable:** Yes
**Category:** Bug
**Architecture:** Frontend

**Location:**
- File: `src/routes/order-tracking.tsx`
- Component: `TrackPage`
- Lines: 55

**Problem:**
The manual order-ID lookup form submits by assigning directly to `window.location.search`:
```ts
if (code) window.location.search = `?id=${encodeURIComponent(code)}`;
```
This bypasses the TanStack Router entirely and forces a full browser page reload.

**Impact:**
In an SSR context (Nitro / Cloudflare Workers) a hard navigation re-runs server-side rendering. All React state is torn down and rebuilt from scratch. On slow connections, the user sees a blank flash. It also breaks the browser's back-button behaviour because a new history entry is created outside the router.

**Recommendation:**
Use the router's `useNavigate` hook, which is already imported for other flows in the app:
```ts
const navigate = useNavigate();
// in onSubmit:
navigate({ to: "/order-tracking", search: { id: code } });
```

---

## Finding 4 — Forgot-Password Modal Reopens Mid-Flow

**Severity:** High
**Actionable:** Yes
**Category:** Bug
**Architecture:** Frontend

**Location:**
- File: `src/components/AuthModal.tsx`
- Component: `AuthModal`
- Lines: 16–17, 106–138

**Problem:**
`forgotStep` is local component state initialised to `1`. When the user advances to step 2 or 3 and then closes the modal (or switches to Login and back), `forgotStep` retains its previous value. The next time the modal opens in "forgot" mode it renders step 2 or 3 directly, skipping the email entry step.

**Impact:**
A user who navigates away mid-flow and returns will see the OTP entry screen with no OTP sent, or the new-password screen with no OTP verified. The flow is broken and confusing.

**Recommendation:**
Reset `forgotStep` to `1` whenever the modal closes or the mode changes away from "forgot":
```ts
const closeModal = useCallback(() => {
  setModalOpen(false);
  setForgotStep(1);
}, []);

const handleSetModalMode = (m: ...) => {
  if (m !== "forgot") setForgotStep(1);
  setModalMode(m);
};
```

---

## Finding 5 — Reservation Accepts Past Dates

**Severity:** High
**Actionable:** Yes
**Category:** Bug
**Architecture:** Frontend

**Location:**
- File: `src/routes/reservation.tsx`
- Component: `ReservationPage`
- Lines: 57

**Problem:**
The date picker is rendered as `<Input type="date" required … />` with no `min` attribute. The browser imposes no lower bound, so a user can successfully submit a reservation for any date in the past.

**Impact:**
Past-date reservations are meaningless and will never be fulfilled. They pollute the reservation history and, once connected to a real backend, would require server-side rejection and additional validation logic. Customers booking for yesterday will receive a confirmation message ("We can't wait to welcome you") that is factually incorrect.

**Recommendation:**
Add a `min` attribute set to today's date:
```tsx
<Input
  type="date"
  required
  min={new Date().toISOString().split("T")[0]}
  value={form.date}
  onChange={(e) => setForm({ ...form, date: e.target.value })}
/>
```

---

## Finding 6 — Price Parsing Fails Silently on Unexpected Format

**Severity:** High
**Actionable:** Yes
**Category:** Bug
**Architecture:** Frontend

**Location:**
- File: `src/context/CartContext.tsx`
- Component: `CartProvider`
- Method: `useMemo` (lines computation)
- Lines: 85–94

**Problem:**
Menu item prices are stored as strings (e.g. `"89 DKK"`) in `src/data/mock.ts`. `parseFloat("89 DKK")` returns `89` because `parseFloat` stops at the first non-numeric character. However, `parseFloat("DKK 89")` returns `NaN`. If the price format in the data source ever changes, all arithmetic (`subtotal`, `tax`, `total`) silently produces `NaN` with no error thrown or logged.

**Impact:**
`NaN` propagates through `subtotal`, `tax`, `delivery`, and `total`. The cart displays `NaN DKK` for all totals. Orders are placed and saved with `total: NaN`. The regression is invisible in tests because there are none.

**Recommendation:**
Store prices as numbers in `mock.ts`, or validate the parsed value:
```ts
const rawPrice = parseFloat(it.price);
const price = Number.isFinite(rawPrice) ? rawPrice : 0;
```
Long-term, change the `price` field in the menu item type from `string` to `number`.

---

## Finding 7 — Order Tracking Always Replays From Stage 0

**Severity:** Medium
**Actionable:** Yes
**Category:** Bug
**Architecture:** Frontend

**Location:**
- File: `src/routes/order-tracking.tsx`
- Component: `TrackPage`
- Method: `useEffect`
- Lines: 34–46

**Problem:**
Every time the tracking page loads with an `id`, five `setTimeout` calls animate `stage` from 0 through 5 at 1.5-second intervals regardless of the order's actual status. The `order.status` field read from `localStorage` is displayed in the aside panel but is never used to initialise `stage`.

**Impact:**
Returning to the tracking page for a completed order always starts back at "Order Placed" and plays the full animation again. The live `STAGES[stage].label` badge shown at the top of the tracker is temporarily wrong, showing "Order Placed" for an order that was "Completed". This is misleading and undermines customer trust.

**Recommendation:**
Map `order.status` to a stage index and seed `setStage` before starting timers:
```ts
const STATUS_TO_STAGE: Record<string, number> = {
  Placed: 0, Accepted: 1, Preparing: 2, Ready: 3, "Out For Delivery": 4, Completed: 5,
};
const initialStage = order ? (STATUS_TO_STAGE[order.status] ?? 0) : 0;
setStage(initialStage);
```

---

## Finding 8 — Duplicate Reservation Created on Resubmit

**Severity:** Medium
**Actionable:** Yes
**Category:** Bug
**Architecture:** Database

**Location:**
- File: `src/routes/reservation.tsx`
- Component: `ReservationPage`
- Method: `onSubmit` (form handler)
- Lines: 34–43

**Problem:**
After a successful submission `setDone(true)` shows the confirmation modal, but `form` state is never reset. If the user dismisses the confirmation by clicking "Done" and submits again, the form still holds all previous values. A second reservation with the same data is written to `localStorage` under a new ID.

**Impact:**
The reservation list in `account.reservations.tsx` accumulates duplicate entries. Once connected to a real backend this would create duplicate bookings, resulting in double-allocated table slots and staff confusion.

**Recommendation:**
Reset the form state on successful submission:
```ts
setDone(true);
setForm({ branch: branches[0].name, guests: "2", date: "", time: "19:00", name: "", phone: "", email: "", note: "" });
```

---

## Finding 9 — `html lang` Is Hardcoded and Never Updated

**Severity:** Medium
**Actionable:** Yes
**Category:** Accessibility
**Architecture:** Frontend

**Location:**
- File: `src/routes/__root.tsx`
- Component: `RootShell`
- Lines: 143

**Problem:**
`<html lang="en">` is static. The app ships a full Danish/English language switcher and defaults to Danish (`"da"`), yet the `lang` attribute never reflects the active language.

**Impact:**
Screen readers announce content in the wrong language, producing incorrect pronunciation. Browser built-in translation prompts offer to translate from the wrong source language. Search engine crawlers index the page as English when the content is Danish. This fails WCAG 2.1 Success Criterion 3.1.1 (Language of Page).

**Recommendation:**
Set the attribute dynamically inside `I18nProvider` via a `useEffect`:
```ts
useEffect(() => {
  document.documentElement.lang = lang;
}, [lang]);
```

---

## Finding 10 — Pricing Computations Recalculate on Every Render

**Severity:** Medium
**Actionable:** Yes
**Category:** Performance
**Architecture:** Frontend

**Location:**
- File: `src/context/CartContext.tsx`
- Component: `CartProvider`
- Lines: 96–106

**Problem:**
`baseDelivery`, `discount`, `delivery`, `taxed`, `tax`, and `total` are computed as plain variable declarations inside the component body. They run on every render, including those triggered by unrelated state changes — most notably `open` (cart drawer visibility), which toggles frequently.

**Impact:**
Every cart drawer open/close event re-runs all six price computations and forces every consumer of `CartContext` to re-render because the context value object is recreated. With a large cart this is noticeable, and it becomes a correctness risk if any computation is later made async or side-effectful.

**Recommendation:**
Fold all derived pricing into the existing `useMemo` alongside `lines`:
```ts
const { lines, subtotal, totalQty, discount, delivery, tax, total } = useMemo(() => {
  // … lines computation …
  const baseDelivery = orderType === "delivery" && subtotal > 0 ? 39 : 0;
  let discount = 0;
  let delivery = baseDelivery;
  if (coupon && COUPONS[coupon]) { … }
  const taxed = Math.max(subtotal - discount, 0);
  const tax = Math.round(taxed * 0.25);
  const total = taxed + tax + delivery;
  return { lines, subtotal, totalQty, discount, delivery, tax, total };
}, [cart, orderType, coupon]);
```

---

## Finding 11 — Checkout Step-Skip Logic Is Triplicated

**Severity:** Medium
**Actionable:** Yes
**Category:** Maintainability
**Architecture:** Frontend

**Location:**
- File: `src/routes/checkout.tsx`
- Component: `CheckoutPage`
- Method: `next()`, `back()`, `visibleSteps`
- Lines: 42–53

**Problem:**
The rule "skip step 4 when order type is pickup" is encoded in three independent places: the `visibleSteps` filter, the `next()` function, and the `back()` function. The `visibleSteps` calculation introduces a `realIdx` offset to re-map display indices back to internal step numbers, creating a parallel representation of the same invariant.

**Impact:**
Any future change to the step structure (e.g. adding a new step or reordering) must be applied in all three locations simultaneously. Missing one causes the progress indicator and the navigation to diverge, showing the wrong step as active or skipping/repeating steps.

**Recommendation:**
Define the step sequence as a single computed array driven by `orderType`, then drive both navigation and the indicator from it:
```ts
const STEPS = [
  { id: 1, label: t("checkout.step1") },
  { id: 2, label: t("checkout.step2") },
  { id: 3, label: t("checkout.step3") },
  { id: 4, label: t("checkout.step4") }, // delivery only
  { id: 5, label: t("checkout.step5") },
  { id: 6, label: t("checkout.step6") },
];
const activeSteps = STEPS.filter((s) => !(s.id === 4 && orderType === "pickup"));
```
`next()` and `back()` then look up the adjacent entry in `activeSteps` instead of applying ad-hoc offset arithmetic.

---

## Finding 12 — `Field` Component Duplicated Across Two Route Files

**Severity:** Medium
**Actionable:** Yes
**Category:** Maintainability
**Architecture:** Frontend

**Location:**
- File 1: `src/routes/checkout.tsx` — Lines: 237–239
- File 2: `src/routes/reservation.tsx` — Lines: 88–90
- Component: `Field` (local)

**Problem:**
An identical `Field` helper component — `<div className="space-y-2"><Label …>{label}</Label>{children}</div>` — is defined as a local function at the bottom of both `checkout.tsx` and `reservation.tsx`.

**Impact:**
Any visual or structural change to the field layout (e.g. adding an error message slot, changing spacing, or adding a required indicator) must be made in both files. The two copies will inevitably diverge over time.

**Recommendation:**
Extract to a shared component, for example `src/components/ui/FormField.tsx`, and import it in both routes.

---

## Finding 13 — `localStorage` Error-Handling Pattern Repeated ~10 Times

**Severity:** Medium
**Actionable:** Yes
**Category:** Maintainability
**Architecture:** Database

**Location:**
- Files: `src/context/CartContext.tsx`, `src/context/AuthContext.tsx`, `src/routes/checkout.tsx`, `src/routes/reservation.tsx`, `src/routes/account.orders.tsx`

**Problem:**
The pattern `try { JSON.parse(localStorage.getItem(key) || "[]") } catch {}` — and its write counterpart — appears approximately ten times across five files with no shared abstraction.

**Impact:**
Silent swallowing of errors makes debugging harder. If `localStorage` is unavailable (e.g. private browsing with strict settings, or storage quota exceeded), every failure is silently ignored and the caller receives a stale or empty default. Any change to the serialisation strategy (e.g. adding encryption or migrating to `sessionStorage`) requires hunting down and updating all ten sites.

**Recommendation:**
Extract two small utilities into `src/lib/storage.ts`:
```ts
export function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function lsSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
```

---

## Finding 14 — Order Summary Pricing UI Duplicated

**Severity:** Low
**Actionable:** Yes
**Category:** Maintainability
**Architecture:** Frontend

**Location:**
- File 1: `src/components/CartDrawer.tsx` — Lines: 79–85
- File 2: `src/routes/checkout.tsx` — Lines: 202–208

**Problem:**
Both `CartDrawer` and the checkout sidebar render the same subtotal / discount / tax / delivery / total breakdown using identical structure, labels, and conditional logic.

**Impact:**
A label change (e.g. renaming "Tax (25%)" to "VAT (25%)") or a new line item must be applied in two places. The two panels will show different information if they drift.

**Recommendation:**
Extract an `<OrderSummary />` component that accepts `{ subtotal, discount, tax, delivery, total }` as props and is shared by both consumers.

---

## Finding 15 — Artificial 500ms Delay on "Add to Cart"

**Severity:** Low
**Actionable:** Yes
**Category:** Performance
**Architecture:** Frontend

**Location:**
- File: `src/routes/menu.tsx`
- Component: `MenuPage`
- Method: `onAdd`
- Lines: 60–66

**Problem:**
`onAdd` always wraps the synchronous `add(name)` call in a `setTimeout(..., 500)` and shows a spinner during the wait. The `add` function in `CartContext` is a pure in-memory state update — it completes in microseconds.

**Impact:**
Every "Add to cart" action on the menu page incurs a 500ms UI freeze where the button is disabled and the user must wait. On a menu with repeated additions this is noticeable friction. The `loadingItem` state and associated render logic exist solely to support this artificial delay.

**Recommendation:**
Remove the `setTimeout`, call `add(i.name)` directly, and delete the `loadingItem` state. The Sonner `toast.success()` already provides sufficient feedback:
```ts
const onAdd = (i: Item) => {
  if (totalQty === 0) {
    setPendingItem(i.name);
    setShowLocationPrompt(true);
  } else {
    add(i.name);
    toast.success(`${i.name} added`);
  }
};
```

---

## Finding 16 — Menu Page Uses Non-Idiomatic Parent-Outlet Pattern

**Severity:** Low
**Actionable:** Yes
**Category:** Architecture
**Architecture:** Frontend

**Location:**
- File: `src/routes/menu.tsx`
- Component: `MenuPage`
- Lines: 42–44, 83–85

**Problem:**
`MenuPage` calls `useMatchRoute` to detect whether a child route (`/menu/:name`) is active and, if so, immediately returns `<Outlet />` to render it. This means the entire `MenuPage` component — including all its hooks (`useCart`, `useMemo`, `useState` × 4) — mounts and executes on every detail-page render before short-circuiting.

**Impact:**
All cart, filter, and location state is unnecessarily initialised on every menu item detail page load. If any of those hooks become expensive (e.g. fetching data from an API), this pattern silently causes unnecessary work. It is also non-idiomatic for TanStack Router and makes the route tree harder to reason about.

**Recommendation:**
Restructure to a proper layout route. Rename `menu.tsx` to `menu/_layout.tsx` (or use TanStack Router's `_layout` convention), move the menu list into `menu/index.tsx`, and let the layout route simply render `<Outlet />`. The detail page at `menu/$name.tsx` already exists and requires no change.

---

## Finding 17 — Dead Import in Checkout

**Severity:** Low
**Actionable:** Yes
**Category:** Maintainability
**Architecture:** Frontend

**Location:**
- File: `src/routes/checkout.tsx`
- Lines: 4

**Problem:**
`Banknote` is imported from `lucide-react` but is never referenced anywhere in `CheckoutPage` or its helper components.

**Impact:**
Minimal at runtime (tree-shaking removes it), but it adds noise, suggests an incomplete feature (cash payment option?), and will cause an ESLint `no-unused-vars` warning if that rule is enabled.

**Recommendation:**
Remove `Banknote` from the import line. If a cash payment method is planned, add it intentionally alongside its implementation.

---

## Summary

| # | Title | Severity | Actionable | Category | Architecture |
|---|-------|----------|------------|----------|--------------|
| 1 | Checkout accepts orders with empty required fields | Critical | Yes | Bug | Frontend |
| 2 | Login error leaves submit button permanently disabled | High | Yes | Bug | Frontend |
| 3 | Order tracking uses hard navigation instead of router | High | Yes | Bug | Frontend |
| 4 | Forgot-password modal reopens mid-flow | High | Yes | Bug | Frontend |
| 5 | Reservation accepts past dates | High | Yes | Bug | Frontend |
| 6 | Price parsing fails silently on unexpected format | High | Yes | Bug | Frontend |
| 7 | Order tracking always replays from stage 0 | Medium | Yes | Bug | Frontend |
| 8 | Duplicate reservation created on resubmit | Medium | Yes | Bug | Database |
| 9 | `html lang` is hardcoded and never updated | Medium | Yes | Accessibility | Frontend |
| 10 | Pricing computations recalculate on every render | Medium | Yes | Performance | Frontend |
| 11 | Checkout step-skip logic is triplicated | Medium | Yes | Maintainability | Frontend |
| 12 | `Field` component duplicated across two route files | Medium | Yes | Maintainability | Frontend |
| 13 | `localStorage` error-handling pattern repeated ~10 times | Medium | Yes | Maintainability | Database |
| 14 | Order summary pricing UI duplicated | Low | Yes | Maintainability | Frontend |
| 15 | Artificial 500ms delay on "Add to cart" | Low | Yes | Performance | Frontend |
| 16 | Menu page uses non-idiomatic parent-outlet pattern | Low | Yes | Architecture | Frontend |
| 17 | Dead import in checkout | Low | Yes | Maintainability | Frontend |
