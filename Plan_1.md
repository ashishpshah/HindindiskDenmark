# Plan 1 — Prioritized Action Plan
**Source:** code_review_findings.md
**Project:** Hind Indisk Restaurant

---

## Phase 1 — Immediate: Fix Before Any Backend Integration

These are broken today and will cause real data problems once a backend is connected.

| # | Finding | Severity | File |
|---|---------|----------|------|
| 1 | Add checkout validation | Critical | `src/routes/checkout.tsx` |
| 2 | Fix login loading state | High | `src/components/AuthModal.tsx` |
| 3 | Fix order tracking navigation | High | `src/routes/order-tracking.tsx` |
| 4 | Fix forgot-password step reset | High | `src/components/AuthModal.tsx` |
| 5 | Block past dates on reservation | High | `src/routes/reservation.tsx` |
| 6 | Fix silent NaN in price parsing | High | `src/context/CartContext.tsx` |

### Task 1.1 — Add Checkout Validation (Finding #1 — Critical)

**File:** `src/routes/checkout.tsx`
**Method:** `next()`, `place()`

Wrap steps 3 and 4 in `<form>` elements or add guards in `next()`. Without this, every order placed is potentially missing customer details.

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

### Task 1.2 — Fix Login Loading State (Finding #2 — High)

**File:** `src/components/AuthModal.tsx`
**Method:** `onLogin`, `onRegister`

Add `try/catch/finally` to `onLogin` and `onRegister` so `loading` is always reset and errors are surfaced to the user.

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

### Task 1.3 — Fix Order Tracking Navigation (Finding #3 — High)

**File:** `src/routes/order-tracking.tsx`
**Lines:** 55

Replace `window.location.search =` with `useNavigate(...)` to avoid a full page reload that bypasses the TanStack Router and breaks SSR.

```ts
const navigate = useNavigate();
// in onSubmit:
navigate({ to: "/order-tracking", search: { id: code } });
```

---

### Task 1.4 — Fix Forgot-Password Step Reset (Finding #4 — High)

**File:** `src/components/AuthModal.tsx`
**Method:** `closeModal`, `setModalMode`

Reset `forgotStep` to `1` on modal close and on mode change so the flow always starts from the beginning.

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

### Task 1.5 — Block Past Dates on Reservation (Finding #5 — High)

**File:** `src/routes/reservation.tsx`
**Lines:** 57

Add a `min` attribute to prevent users from booking a reservation for a past date.

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

### Task 1.6 — Fix Silent NaN in Price Parsing (Finding #6 — High)

**File:** `src/context/CartContext.tsx` and `src/data/mock.ts`
**Lines:** 85–94

Change the `price` field in `mock.ts` from `string` to `number`, or add a `Number.isFinite()` guard to prevent `NaN` propagating silently through all cart totals.

```ts
const rawPrice = parseFloat(it.price);
const price = Number.isFinite(rawPrice) ? rawPrice : 0;
```

Long-term: change the `price` field type from `string` to `number` in the mock data and the `MenuItem` type.

---

## Phase 2 — Short-Term: Before a Public Launch

| # | Finding | Severity | File |
|---|---------|----------|------|
| 7 | Clear reservation form after submit | Medium | `src/routes/reservation.tsx` |
| 8 | Fix `html lang` attribute | Medium | `src/routes/__root.tsx` / `src/i18n/I18nProvider.tsx` |
| 9 | Seed order tracking stage from saved status | Medium | `src/routes/order-tracking.tsx` |
| 10 | Move pricing into `useMemo` | Medium | `src/context/CartContext.tsx` |

### Task 2.1 — Clear Reservation Form After Submit (Finding #8 — Medium)

**File:** `src/routes/reservation.tsx`
**Method:** `onSubmit`

Reset form state after a successful submission to prevent duplicate entries in localStorage (and later a real database).

```ts
setDone(true);
setForm({
  branch: branches[0].name,
  guests: "2",
  date: "",
  time: "19:00",
  name: "",
  phone: "",
  email: "",
  note: "",
});
```

---

### Task 2.2 — Fix `html lang` Attribute (Finding #9 — Medium)

**File:** `src/i18n/I18nProvider.tsx`

Add a `useEffect` to keep the `<html lang>` attribute in sync with the active language for accessibility compliance (WCAG 2.1 SC 3.1.1).

```ts
useEffect(() => {
  document.documentElement.lang = lang;
}, [lang]);
```

---

### Task 2.3 — Seed Order Tracking Stage From Saved Status (Finding #7 — Medium)

**File:** `src/routes/order-tracking.tsx`
**Method:** `useEffect`

Map `order.status` to a stage index and initialise `stage` from it so the tracking page does not replay the full animation for completed orders.

```ts
const STATUS_TO_STAGE: Record<string, number> = {
  Placed: 0, Accepted: 1, Preparing: 2,
  Ready: 3, "Out For Delivery": 4, Completed: 5,
};
const initialStage = order ? (STATUS_TO_STAGE[order.status] ?? 0) : 0;
setStage(initialStage);
```

---

### Task 2.4 — Move Pricing Into `useMemo` (Finding #10 — Medium)

**File:** `src/context/CartContext.tsx`

Consolidate all derived pricing values inside the existing `useMemo` to prevent unnecessary recalculation and re-renders on unrelated state changes such as the cart drawer toggling.

```ts
const { lines, subtotal, totalQty, discount, delivery, tax, total } = useMemo(() => {
  // … existing lines computation …
  const baseDelivery = orderType === "delivery" && subtotal > 0 ? 39 : 0;
  let discount = 0;
  let delivery = baseDelivery;
  if (coupon && COUPONS[coupon]) {
    const c = COUPONS[coupon];
    if (c.type === "percent") discount = Math.round((subtotal * c.value) / 100);
    if (c.type === "freeDelivery") delivery = 0;
  }
  const taxed = Math.max(subtotal - discount, 0);
  const tax = Math.round(taxed * 0.25);
  const total = taxed + tax + delivery;
  return { lines, subtotal, totalQty, discount, delivery, tax, total };
}, [cart, orderType, coupon]);
```

---

## Phase 3 — Refactoring Sprint: Code Health

Batch these into a single cleanup PR. No user-facing behaviour changes.

| # | Finding | Severity | File |
|---|---------|----------|------|
| 11 | Consolidate checkout step-skip logic | Medium | `src/routes/checkout.tsx` |
| 12 | Extract shared `Field` component | Medium | `checkout.tsx`, `reservation.tsx` |
| 13 | Create `lsGet` / `lsSet` storage helpers | Medium | Multiple files |
| 14 | Extract `<OrderSummary />` component | Low | `CartDrawer.tsx`, `checkout.tsx` |
| 17 | Remove dead `Banknote` import | Low | `src/routes/checkout.tsx` |

### Task 3.1 — Consolidate Checkout Step-Skip Logic (Finding #11 — Medium)

**File:** `src/routes/checkout.tsx`

Replace the three separate `orderType === "pickup"` checks in `visibleSteps`, `next()`, and `back()` with a single computed `activeSteps` array.

```ts
const activeSteps = STEPS.filter((s) => !(s.id === 4 && orderType === "pickup"));
// next() and back() navigate within activeSteps by index
```

---

### Task 3.2 — Extract Shared `Field` Component (Finding #12 — Medium)

**New file:** `src/components/ui/FormField.tsx`

The identical `Field` helper defined locally in both `checkout.tsx` and `reservation.tsx` should be extracted and imported from a shared location.

```tsx
export function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}
```

---

### Task 3.3 — Create `lsGet` / `lsSet` Storage Helpers (Finding #13 — Medium)

**New file:** `src/lib/storage.ts`

Replace the ~10 inline `try/catch` localStorage blocks across five files with two shared utilities.

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

Files to update after extraction:
- `src/context/CartContext.tsx`
- `src/context/AuthContext.tsx`
- `src/routes/checkout.tsx`
- `src/routes/reservation.tsx`
- `src/routes/account.orders.tsx`

---

### Task 3.4 — Extract `<OrderSummary />` Component (Finding #14 — Low)

**New file:** `src/components/OrderSummary.tsx`

The identical pricing breakdown rendered in both `CartDrawer` and the checkout sidebar should be a single shared component.

```tsx
type Props = { subtotal: number; discount: number; tax: number; delivery: number; total: number; };

export function OrderSummary({ subtotal, discount, tax, delivery, total }: Props) {
  return (
    <>
      <div className="space-y-1 text-sm text-muted-foreground">
        <Row label="Subtotal" value={`${subtotal} DKK`} />
        {discount > 0 && <Row label="Discount" value={`-${discount} DKK`} highlight />}
        <Row label="Tax (25%)" value={`${tax} DKK`} />
        <Row label="Delivery" value={delivery === 0 ? "Free" : `${delivery} DKK`} />
      </div>
      <div className="mt-3 flex justify-between border-t pt-3 font-display text-lg">
        <span>Total</span><span>{total} DKK</span>
      </div>
    </>
  );
}
```

---

### Task 3.5 — Remove Dead `Banknote` Import (Finding #17 — Low)

**File:** `src/routes/checkout.tsx`
**Lines:** 4

Remove `Banknote` from the lucide-react import. If a cash payment option is planned, add it alongside its implementation.

---

## Phase 4 — Low Priority: When Time Allows

| # | Finding | Severity | File |
|---|---------|----------|------|
| 15 | Remove artificial 500ms delay on "Add to cart" | Low | `src/routes/menu.tsx` |
| 16 | Refactor menu page to a layout route | Low | `src/routes/menu.tsx` |

### Task 4.1 — Remove Artificial 500ms Delay (Finding #15 — Low)

**File:** `src/routes/menu.tsx`
**Method:** `onAdd`

Remove the `setTimeout`, `loadingItem` state, and spinner. Call `add(i.name)` synchronously.

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

### Task 4.2 — Refactor Menu Page to a Layout Route (Finding #16 — Low)

**File:** `src/routes/menu.tsx`

Replace the `useMatchRoute` + early `return <Outlet />` guard with a proper TanStack Router layout route so the menu list component does not mount on detail page renders.

**Steps:**
1. Create `src/routes/menu/_layout.tsx` — renders only `<Outlet />`
2. Move current `menu.tsx` list UI into `src/routes/menu/index.tsx`
3. `menu.$name.tsx` requires no changes
4. Delete the `useMatchRoute` / `isDetails` logic from the list component

---

## Execution Order Summary

```
Phase 1 (Critical + High bugs)     →  Fix now, before any backend work
Phase 2 (Medium — UX + correctness) →  Fix before public launch
Phase 3 (Refactoring sprint)        →  Single PR, no behaviour changes
Phase 4 (Low priority)              →  Schedule when capacity allows
```
