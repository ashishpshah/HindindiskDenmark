# Admin Panel — Full Code Audit

**Scope:** All 21 admin routes + 4 admin components + 25 hooks + DataTable + backend controller/service  
**Status legend:** 🔴 Bug (broken behaviour) · 🟡 Warning (misleading/fragile) · 🟢 Missing feature · ⚪ Polish

---

## Bugs (Broken Behaviour)

### 🔴 B1 — Dead hook in `OrderExpandedRow` → status select never disabled
**File:** [src/routes/admin.orders.tsx](src/routes/admin.orders.tsx#L30)

`OrderExpandedRow` calls `useUpdateOrderStatus()` to get an `isPending` flag, but it **never calls mutate on that instance**. The actual mutation fires in the parent via the `onStatusChange` callback. Result: `disabled={updateStatus.isPending}` is always `false` — the select is never disabled, and rapid-clicking submits duplicate status changes.

**Fix:**
```tsx
// Remove the hook from OrderExpandedRow entirely
function OrderExpandedRow({ order, onStatusChange, isUpdating }: {
  order: AdminOrderDto;
  onStatusChange: (id: number, s: string) => void;
  isUpdating: boolean;  // ← pass from parent
}) {
  // no useUpdateOrderStatus() here
  ...
  <Select ... disabled={isUpdating}>
```
Then in `AdminOrders` pass `isUpdating={updateStatus.isPending}`.

---

### 🔴 B2 — Dead hook in `ReservationExpandedRow` → action buttons never disabled
**File:** [src/routes/admin.reservations.tsx](src/routes/admin.reservations.tsx#L23)

Identical pattern — `useUpdateReservationStatus()` instantiated but never mutated. `disabled={updateStatus.isPending}` is always `false`. Double-clicking Confirm/Cancel fires duplicate requests.

**Fix:** Same as B1 — remove the inner hook, add `isUpdating: boolean` prop from the parent.

---

### 🔴 B3 — Toggle toast fires before mutation resolves
**Files:** [src/routes/admin.menus.index.tsx](src/routes/admin.menus.index.tsx#L64), [src/routes/admin.offers.index.tsx](src/routes/admin.offers.index.tsx#L86)

```tsx
onChange={() => {
  toggleMenu.mutate(row.original.id);           // fires async
  toast(`Menu ${row.original.isActive ? "deactivated" : "activated"}.`); // fires immediately
}}
```
If the mutation fails, the success toast already showed the wrong state. No error feedback.

**Fix:** Use `mutateAsync` + try/catch, or pass `onSuccess`/`onError` to `mutate`:
```tsx
onChange={() => {
  toggleMenu.mutate(row.original.id, {
    onSuccess: () => toast.success(`Menu ${row.original.isActive ? "deactivated" : "activated"}.`),
    onError:   () => toast.error("Failed to update status."),
  });
}}
```

---

### 🔴 B4 — `EMPTY` offer form uses module-load date, not today
**File:** [src/routes/admin.offers.new.tsx](src/routes/admin.offers.new.tsx#L14)

```tsx
const EMPTY: CreateOfferInput = {
  startDate: new Date().toISOString().slice(0, 10),   // frozen at first import
  endDate:   new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10),
};
```
Module-level `new Date()` runs once when the module is first cached by the bundler. After browser stays open past midnight (or the cache persists across sessions), the default dates are stale.

**Fix:** Move into the component or compute inside `useState` initializer:
```tsx
const [form, setForm] = useState<CreateOfferInput>(() => ({
  ...EMPTY,
  startDate: new Date().toISOString().slice(0, 10),
  endDate:   new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10),
}));
```

---

### 🔴 B5 — `DataTable` expandedId uses row index string, not record ID
**File:** [src/components/ui/data-table.tsx](src/components/ui/data-table.tsx#L64)

```tsx
const [expandedId, setExpandedId] = useState<string | null>(null);
...
const rowKey = row.id;  // TanStack Table uses "0", "1", "2"…
```
`row.id` is the zero-based index as a string. After sorting or filtering, the same visual row index maps to a different record. A previously expanded row can collapse/re-expand on a different record when sort order changes.

**Fix:** Derive a stable ID from the data itself, e.g. pass a `getRowId` prop to `useReactTable`:
```tsx
getRowId: (row: TData) => String((row as { id?: unknown }).id ?? row),
```
Or keep track of record IDs per usage site by accepting a `rowId` accessor prop.

---

### 🔴 B6 — Non-standard locale `"en-DK"` in date formatting
**Files:** [src/routes/admin.orders.tsx](src/routes/admin.orders.tsx#L136), [src/routes/admin.reservations.tsx](src/routes/admin.reservations.tsx#L120), [src/routes/admin.customers.tsx](src/routes/admin.customers.tsx#L73)

`"en-DK"` is not a valid BCP 47 language tag. Some browsers fall back gracefully; others throw or produce garbled output. Use `"da-DK"` for Danish formatting or `"en-GB"` for English with day/month ordering.

---

## Warnings (Misleading / Fragile)

### 🟡 W1 — Customer status column is always "Active"
**File:** [src/routes/admin.customers.tsx](src/routes/admin.customers.tsx#L102)

```tsx
cell: () => <ActiveBadge active={true} />,
```
`AdminCustomerDto` has no `isActive` field so there is nothing to bind to — but the column header says "Status" and always shows green "Active". Either remove the column or omit the column until the backend exposes a real flag.

---

### 🟡 W2 — Branch status column is always "Active"
**File:** [src/routes/admin.branches.index.tsx](src/routes/admin.branches.index.tsx#L52)

Same pattern as W1. Remove or wire to a real `isActive` field.

---

### 🟡 W3 — `handleAddItem` in menu edit has no success feedback
**File:** [src/routes/admin.menus.$menuId.tsx](src/routes/admin.menus.$menuId.tsx#L116)

```tsx
const handleAddItem = async (itemId: number) => {
  try {
    await addItem.mutateAsync({ menuId: menu.id, itemId });
    setPickerSearch("");
    // ← no toast here
  } catch { toast.error("Failed to add item."); }
};
```
Every other action (unlink, delete, save) shows a toast on success. Adding an item is silent.

**Fix:** Add `toast.success("Item added to menu.");` after `await addItem.mutateAsync`.

---

### 🟡 W4 — `InlineStatusSelect.onChange` receives a boolean the callers ignore
**File:** [src/components/admin/InlineStatusSelect.tsx](src/components/admin/InlineStatusSelect.tsx#L1)

The component calls `onChange(true/false)` but every caller ignores the argument and just calls `toggleX.mutate(id)` directly. The prop type is `(active: boolean) => void` but no caller uses the boolean. Makes the API confusing.

**Fix:** Change the prop to a plain callback: `onToggle: () => void`.

---

### 🟡 W5 — Order expanded row: items list is absent
**File:** [src/routes/admin.orders.tsx](src/routes/admin.orders.tsx#L29)

The expanded row shows Contact · Delivery Address · Payment · Update Status — but **not the line items in the order**. Staff can't verify what was ordered without leaving this screen.

---

### 🟡 W6 — `admin.menus.index.tsx` shows English description only, even when Danish is set
The description cell renders `row.original.description` (English). After adding Danish support, the admin list should show both or at least indicate DA is set (e.g. a flag badge).

---

## Missing Features

### 🟢 F1 — Offers: no delete action
**File:** [src/routes/admin.offers.index.tsx](src/routes/admin.offers.index.tsx#L99)

```tsx
<ActionButtons onEdit={() => navigate(...)} />   // onDelete is undefined
```
Offers can only be toggled inactive; they cannot be deleted. There is no `useDeleteOffer` hook. Add delete capability or document the intentional soft-delete-only policy.

---

### 🟢 F2 — Customers: no server-side search UI
**File:** [src/routes/admin.customers.tsx](src/routes/admin.customers.tsx#L50)

`useAdminCustomers(q?: string)` supports `?q=` server-side search but the component passes nothing. The DataTable global search is client-side only (works on already-loaded data). A search bar above the table wired to the hook's `q` param would let staff find customers without loading all records.

---

### 🟢 F3 — Reservations: "Pending" status is unfiltered
**File:** [src/routes/admin.reservations.tsx](src/routes/admin.reservations.tsx#L128)

The filter dropdown only has "Confirmed" and "Cancelled". If the backend assigns an initial "Pending" status to new reservations, they cannot be isolated. Add `<SelectItem value="Pending">Pending</SelectItem>` to both the filter and to `STATUS_COLORS`.

---

### 🟢 F4 — Menu items list: `isVegetarian` badge missing
**File:** [src/routes/admin.menu.index.tsx](src/routes/admin.menu.index.tsx#L63)

The item row shows image, name, description, menus, spice badge, and actions — but `AdminMenuItemDto.isVegetarian` and `labels` are fetched but never displayed. A small green leaf icon in the "Item" cell would match the public menu page.

---

### 🟢 F5 — Dashboard Quick Links card is static text
**File:** [src/routes/admin.index.tsx](src/routes/admin.index.tsx#L90)

```tsx
<div className="rounded-2xl border bg-card p-6 shadow-soft">
  <h2>Quick Links</h2>
  <p className="text-sm text-muted-foreground">Use the sidebar to manage...</p>
</div>
```
Replace with action cards or a shortcut grid (e.g. "New Order" → orders, "New Reservation" → reservations, "Pending orders" badge).

---

### 🟢 F6 — Admin layout is not responsive (no mobile sidebar)
**File:** [src/routes/admin.tsx](src/routes/admin.tsx#L151)

```tsx
<aside className="w-56 shrink-0 border-r bg-card flex flex-col">
```
The sidebar is always visible at 56 w. On screens narrower than ~800px the main content area is squeezed to ~200px. No hamburger/drawer pattern exists. Add a collapsible sidebar or a mobile drawer for `md:hidden`.

---

### 🟢 F7 — Menus list: no DA name indicator
**File:** [src/routes/admin.menus.index.tsx](src/routes/admin.menus.index.tsx#L38)

After adding `nameDa`/`descriptionDa`, the list page still only shows English names. Add a small "DA" chip (similar to how items show spice badges) when `nameDa` is set, so editors know which categories still need translations.

---

### 🟢 F8 — Menu items list: no prices column in main row
**File:** [src/routes/admin.menu.index.tsx](src/routes/admin.menu.index.tsx#L59)

Price data is in `AdminMenuItemDto.prices` but the main row has no price column — it's only visible when expanding the row. A condensed "from X DKK" label in the main row would save clicks.

---

## Polish / Low Priority

| # | Location | Note |
|---|----------|------|
| ⚪ P1 | `admin.menus.$menuId.tsx` | `maxWidth="max-w-3xl"` inconsistent with items forms (`max-w-2xl`). Pick one. |
| ⚪ P2 | `admin.branches.index.tsx` | Uses raw `<button>` for Edit instead of `<ActionButtons>` like every other list page. |
| ⚪ P3 | `admin.offers.index.tsx` | `discountType` column shows raw enum string ("FixedAmount", "FreeShipping") — should map to friendly labels. |
| ⚪ P4 | `admin.index.tsx` | Dashboard has 6 stat cards but no "Pending Reservations" or "Revenue this month" cards — natural next metrics. |
| ⚪ P5 | `DataTable` | CSV export serialises raw cell values (e.g. booleans as "true"), not the formatted label strings rendered in cells. |
| ⚪ P6 | All forms | Browser `<input type="email">` / `type="tel"` present but no Zod validation on submit — invalid emails reach the backend. |
| ⚪ P7 | `admin.customers.tsx` | `reservationCount` column is present but there is no drill-down to the reservation list the way orders are shown in the expanded row. |
| ⚪ P8 | `ImagePicker.tsx` | Accepts `.gif` in the `<input accept>` but the backend `AllowedExtensions` in `AdminController` does include gif — they're in sync. Just worth keeping in sync if extensions ever change. |
| ⚪ P9 | `DataTable` | Print renders whatever is in the DOM (including React interactives like buttons, selects). The CSS rule `@media print { button, input, select { display:none } }` helps but does not cleanly hide status badges or pill selects — consider a dedicated print-only CSS class. |

---

## Summary Table

| Severity | Count | Items |
|----------|-------|-------|
| 🔴 Bug | 6 | B1 B2 B3 B4 B5 B6 |
| 🟡 Warning | 6 | W1 W2 W3 W4 W5 W6 |
| 🟢 Missing | 8 | F1–F8 |
| ⚪ Polish | 9 | P1–P9 |

**Highest-impact fixes (in order):** B1/B2 (duplicate mutation calls possible), B3 (misleading UI on error), B5 (wrong row expands after sort), B4 (stale form dates), F1 (offers can't be deleted), W5 (order items invisible to staff).
