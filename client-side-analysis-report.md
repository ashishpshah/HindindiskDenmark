# Hind Indisk Web — Client-Side Codebase Analysis Report

**Source directory:** `hindindisk.web.client/src`  
**Generated:** 2026-06-26  
**Analyst:** Claude Code (claude-sonnet-4-6)

---

## Section 1: Executive Summary

### Component / Page Inventory

| Category | Count |
|---|---|
| Pages (route-level components) | 31 |
| Shared / layout components | 12 |
| Home section sub-components | 9 |
| Admin sub-components (reusable) | 5 |
| UI primitives (shadcn/custom) | ~20+ |
| Context providers | 3 (Auth, Cart, I18n) |
| Custom React hooks | 43 |
| Forms (distinct form UIs) | 14 |
| Modals / Dialogs | 9 |
| Data tables (DataTable instances) | 6 |
| Cards / card-like widgets | 18+ |

### Classification Split

| Classification | Count (pages + major components) | % |
|---|---|---|
| **Dynamic** (API calls or significant state) | 38 | 88% |
| **Mixed** (partial static + some dynamic) | 4 | 9% |
| **Static** (no API, no state, markup only) | 1 | 3% |

### Key Observations

1. **Almost entirely API-driven.** All user-facing pages except `GalleryPage` make at least one API call via TanStack Query. Even decorative home sections like `Offers` and `Branches` pull live data from the backend.
2. **TanStack Router + TanStack Query as the central spine.** File-based routes via `routeTree.gen.ts`, a shared `QueryClient` injected into router context, and `useQuery`/`useMutation` everywhere.
3. **Three global contexts.** `AuthContext` (auth state + modal), `CartContext` (cart, coupon, branch, order type), and `I18nProvider` (EN/DA language). All persist critical state to localStorage.
4. **Bilingual UI.** All menu items and menus have English and Danish (`nameDa`, `descriptionDa`, `categoryDa`) fields. The `useLocalized` hook drives field selection. The header exposes a language switcher.
5. **Sophisticated checkout.** A 6-step wizard (Branch → Order Type → Contact → Delivery Address → Payment → Review) with smart customer auto-lookup via debounced phone/email.
6. **Reservation system with duplicate detection.** Real-time phone/email customer lookup, duplicate reservation check against the API, and an AnimatePresence confirmation dialog.
7. **Full admin CMS.** Admin routes cover orders, reservations, customers, menu items, menus, offers, and branches — all using a reusable `DataTable` with filtering, inline status toggles, and CRUD forms.
8. **Framer Motion is pervasive.** Page transitions, scroll-triggered animations (`useInView`, `useScroll`, `useSpring`), `AnimatePresence` on modals/drawers/dialogs, and spring-animated carousels.
9. **JWT auth with auto-logout.** `apiFetch` dispatches a custom `hind:session-expired` event on 401; `AuthContext` catches it and clears local state.
10. **Image upload.** `ImagePicker` component uses `useUploadImage` → `POST /api/admin/upload/image` (multipart) via `apiUpload`.

---

## Section 2: Project Structure

### Directory Tree

```
src/
├── main.tsx                    # Entry point — StrictMode + RouterProvider
├── router.tsx                  # QueryClient creation, TanStack Router config
├── styles.css                  # Tailwind CSS base + custom CSS variables
├── routeTree.gen.ts            # Auto-generated route tree (TanStack Router)
│
├── routes/
│   ├── __root.tsx              # Root: QueryClientProvider › I18nProvider › AuthProvider › CartProvider › Outlet › Toaster
│   ├── index.tsx               # / — Home page
│   ├── about.tsx               # /about
│   ├── contact.tsx             # /contact
│   ├── gallery.tsx             # /gallery
│   ├── locations.tsx           # /locations
│   ├── menu.tsx                # /menu — layout outlet
│   ├── menu.index.tsx          # /menu/ — menu listing
│   ├── menu.$name.tsx          # /menu/:name — dish details
│   ├── offers.tsx              # /offers
│   ├── order-tracking.tsx      # /order-tracking
│   ├── reservation.tsx         # /reservation
│   ├── account.tsx             # /account — layout + auth guard
│   ├── account.index.tsx       # /account/ — dashboard
│   ├── account.profile.tsx     # /account/profile
│   ├── account.orders.tsx      # /account/orders
│   ├── account.reservations.tsx
│   ├── account.addresses.tsx
│   ├── account.coupons.tsx
│   ├── admin.tsx               # /admin — layout + login form
│   ├── admin.index.tsx         # /admin/ — dashboard
│   ├── admin.orders.tsx
│   ├── admin.reservations.tsx
│   ├── admin.customers.tsx
│   ├── admin.menu.tsx          # /admin/menu — layout outlet
│   ├── admin.menu.index.tsx
│   ├── admin.menu.new.tsx
│   ├── admin.menu.$itemId.tsx
│   ├── admin.menus.tsx         # /admin/menus — layout outlet
│   ├── admin.menus.index.tsx
│   ├── admin.menus.new.tsx
│   ├── admin.menus.$menuId.tsx
│   ├── admin.offers.tsx        # /admin/offers — layout outlet
│   ├── admin.offers.index.tsx
│   ├── admin.offers.new.tsx
│   ├── admin.offers.$offerId.tsx
│   ├── admin.branches.tsx      # /admin/branches — layout outlet
│   ├── admin.branches.index.tsx
│   ├── admin.branches.new.tsx
│   └── admin.branches.$branchId.tsx
│
├── context/
│   ├── AuthContext.tsx         # User auth, modal mode, login/register/logout/updateProfile
│   └── CartContext.tsx         # Cart entries, coupon, branch, order type, totals
│
├── components/
│   ├── Header.tsx              # Fixed nav, language switcher, branch selector, cart badge, auth controls, mobile drawer
│   ├── Footer.tsx              # Footer with branch data from API
│   ├── Layout.tsx              # Wraps public pages; scroll-to-top FAB, WhatsApp + phone FABs
│   ├── PageHero.tsx            # Hero banner with animated entrance
│   ├── AuthModal.tsx           # Login/Register/Forgot modal (3-step OTP flow)
│   ├── CartDrawer.tsx          # Slide-out cart, coupon validation, order summary
│   ├── MenuItemPhoto.tsx       # Image with fallback placeholder
│   ├── OrderSummary.tsx        # Price breakdown display (i18n labels)
│   ├── AddressSelectDialog.tsx # Pick saved address dialog
│   │
│   ├── home/
│   │   ├── Hero.tsx            # Fullscreen slideshow hero
│   │   ├── Branches.tsx        # Branch cards (API) + SectionHeading helper
│   │   └── Sections.tsx        # About, FeaturedMenu, WhyChooseUs, Offers, Reviews, CTA
│   │   └── GalleryFAQ.tsx      # GalleryStrip, FAQ accordion
│   │
│   ├── admin/
│   │   ├── BranchMultiSelect.tsx  # Toggle-chip multi-select for branch assignment
│   │   ├── ConfirmDialog.tsx      # Generic AlertDialog wrapper
│   │   ├── FormPage.tsx           # Admin form layout wrapper with back link
│   │   ├── ImagePicker.tsx        # File upload + URL fallback with upload state
│   │   └── InlineStatusSelect.tsx # Active/Inactive select dropdown
│   │
│   └── ui/
│       ├── data-table.tsx         # Generic sortable/filterable/expandable table
│       ├── map.tsx                # Lazy WorldMap (react-simple-maps)
│       ├── FormField.tsx          # Label + input wrapper
│       └── [shadcn components]    # accordion, alert-dialog, button, card, dialog,
│                                  # drawer, dropdown-menu, input, label, select,
│                                  # sheet, sidebar, switch, tabs, toast, sonner, etc.
│
├── hooks/                         # 43 custom hooks (all TanStack Query wrappers)
│   ├── [query hooks]              # useMenuItems, useBranches, usePublicOffers,
│   │                              # useMyOrders, useMyReservations, useOrder,
│   │                              # useAddresses, useMenuItem, useMenuCategories,
│   │                              # useAdminDashboard, useAdminOrders, useAdminReservations,
│   │                              # useAdminCustomers, useAdminMenuItems, useAdminMenus,
│   │                              # useAdminOffers, useAdminBranches
│   └── [mutation hooks]           # useCreateOrder, useCreateReservation, useUpdateProfile,
│                                  # useAddAddress, useUpdateAddress, useDeleteAddress,
│                                  # useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem,
│                                  # useUpdateMenuItemPrices, useCreateMenu, useUpdateMenu,
│                                  # useDeleteMenu, useToggleMenu, useAddItemToMenu,
│                                  # useRemoveItemFromMenu, useReorderMenuItems,
│                                  # useCreateOffer, useUpdateOffer, useDeleteOffer,
│                                  # useToggleOffer, useCreateBranch, useUpdateBranch,
│                                  # useUpdateOrderStatus, useUpdateReservationStatus,
│                                  # useUploadImage, useCustomerLookup (debounced dual query)
│
├── data/
│   └── mock.ts                    # Static mock data: heroSlides, stats, whyChooseUs,
│                                  # reviews, galleryImages, faqs, navLinks, teamMembers,
│                                  # timeline (fallback data for About page)
│
├── i18n/
│   ├── I18nProvider.tsx           # Context: lang (da|en), setLang, t() lookup
│   └── translations.ts            # Nested EN+DA strings (cart, nav, reservation, etc.)
│
└── lib/
    ├── api/client.ts              # apiFetch<T>, apiUpload<T>, JWT header, 401 handler
    ├── storage.ts                 # lsGet, lsSet, lsRemove (safe localStorage wrappers)
    └── utils.ts                   # cn() (clsx + tailwind-merge)
```

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 (StrictMode) |
| Language | TypeScript |
| Routing | TanStack Router v1 (file-based, `createFileRoute`, `createRootRouteWithContext`) |
| Data fetching | TanStack Query v5 (`useQuery`, `useMutation`, `QueryClient`) |
| Styling | Tailwind CSS v3 |
| Component library | shadcn/ui (Radix UI primitives) |
| Animations | Framer Motion (`motion`, `AnimatePresence`, `useScroll`, `useSpring`, `useInView`) |
| Icons | Lucide React |
| Toast notifications | Sonner |
| Form validation | Zod (order-tracking search params only) |
| i18n | Custom `I18nProvider` + `translations.ts` (EN/DA) |
| Build tool | Vite (`import.meta.env.VITE_API_URL`) |
| Maps | react-simple-maps (lazy-loaded `WorldMap`) |

### State Management Patterns

| Pattern | Usage |
|---|---|
| **TanStack Query** | All server state — queries cached, invalidated on mutations |
| **Context API (AuthContext)** | Global user, token, modal mode; persisted to localStorage |
| **Context API (CartContext)** | Global cart entries, coupon, branch, order type; computed totals via `useMemo`; persisted to localStorage |
| **Context API (I18nProvider)** | Active language (da/en); persisted to localStorage |
| **Local `useState`** | Form fields, UI toggles, dialog open state within each component |
| **URL state (TanStack Router)** | `useSearch` for order-tracking id param (Zod-validated); URL params for menu item `$name`, admin `$itemId`, `$menuId`, `$offerId`, `$branchId` |

### Data Fetching Patterns

- **All API calls** go through `apiFetch<T>` or `apiUpload<T>` in `src/lib/api/client.ts`.
- JWT token is read from `localStorage["hind-token"]` and attached as `Authorization: Bearer <token>` on every request.
- `401` responses trigger `localStorage` cleanup and dispatch the `hind:session-expired` custom event, which `AuthContext` catches to auto-logout.
- Query keys follow a consistent naming pattern: `["branches"]`, `["menu-items", filters]`, `["my-orders"]`, `["admin-orders", status, branchId]`, etc.
- Mutations call `qc.invalidateQueries(...)` in `onSuccess` to refresh related lists automatically.
- `useCustomerLookup` is the most complex: it runs two parallel debounced queries (phone: 600ms, email: 800ms), preferring the phone match, and returns the matched field identifier.

### LocalStorage Keys

| Key | Contents |
|---|---|
| `hind-token` | JWT string |
| `hind-user` | Serialized user object |
| `hind-cart` | Cart entries (Record\<id, CartEntry\>) |
| `hind-branch` | Selected branch name |
| `hind-coupon` | Applied coupon code |
| `hind-lang` | Active language (`da` or `en`) |

---

## Section 3: Detailed Analysis

### Public Pages

---

#### 1. HomePage

| Field | Value |
|---|---|
| **Name** | HomePage |
| **File** | `src/routes/index.tsx` |
| **Type** | Page (route `/`) |
| **Classification** | Mixed |
| **User Interactions** | None directly on the page shell; delegated to sub-sections |
| **Dynamic Behavior** | Assembles Hero, Branches (API), About (mock stats), FeaturedMenu (API signatures), WhyChooseUs (mock), Offers (API home offers), Reviews (mock carousel), GalleryStrip (mock), FAQ (mock), CTA |
| **Data Sources** | `GET /api/locations` (Branches), `GET /api/menu/items?signature=true` (FeaturedMenu), `GET /api/offers/home` (Offers) |
| **Evidence** | `import { Branches } from "@/components/home/Branches"` + `useBranches()`, `useMenuItems({ signature: true })`, `useHomeOffers()` |

---

#### 2. Hero (home sub-section)

| Field | Value |
|---|---|
| **Name** | Hero |
| **File** | `src/components/home/Hero.tsx` |
| **Type** | Home section component |
| **Classification** | Mixed |
| **User Interactions** | Dot navigation buttons to jump to a specific slide; auto-advances every 6 seconds |
| **Dynamic Behavior** | `useState(0)` for slide index; `setInterval` auto-play; `AnimatePresence` cross-fade transitions |
| **Data Sources** | `heroSlides` from `src/data/mock.ts` (static) |
| **Evidence** | `const [i, setI] = useState(0)` + `setInterval(() => setI((p) => (p + 1) % heroSlides.length), 6000)` |

---

#### 3. Branches (home sub-section)

| Field | Value |
|---|---|
| **Name** | Branches |
| **File** | `src/components/home/Branches.tsx` |
| **Type** | Home section component |
| **Classification** | Dynamic |
| **User Interactions** | "View →" link to `/locations` |
| **Dynamic Behavior** | Renders live branch data with rating, review count, hours, and city |
| **Data Sources** | `GET /api/locations` via `useBranches()` |
| **Evidence** | `const { data: branchesData = [] } = useBranches()` |

---

#### 4. About (home sub-section)

| Field | Value |
|---|---|
| **Name** | About |
| **File** | `src/components/home/Sections.tsx` |
| **Type** | Home section component |
| **Classification** | Mixed |
| **User Interactions** | "Discover Our Story" link to `/about`; animated counter increments on scroll into view |
| **Dynamic Behavior** | `Counter` component: `useInView` triggers a `setInterval` number animation when the stat enters viewport |
| **Data Sources** | `stats` from `src/data/mock.ts` (static) |
| **Evidence** | `const inView = useInView(ref, { once: true })`; `setInterval(() => { cur += step; … }, 30)` |

---

#### 5. FeaturedMenu (home sub-section)

| Field | Value |
|---|---|
| **Name** | FeaturedMenu |
| **File** | `src/components/home/Sections.tsx` |
| **Type** | Home section component |
| **Classification** | Dynamic |
| **User Interactions** | Prev/Next carousel buttons; hover pauses auto-scroll; "Add to cart" (+) button per card |
| **Dynamic Behavior** | Auto-advancing spring-animated carousel (paused on hover); add-to-cart calls `useCart().add()`; shows toast on add |
| **Data Sources** | `GET /api/menu/items?signature=true&branchId=...` via `useMenuItems({ signature: true, branchId })` |
| **Evidence** | `const { data: items = [] } = useMenuItems({ signature: true, branchId: currentBranchId })` + `add({ id, name, price, imageUrl })` |

---

#### 6. WhyChooseUs (home sub-section)

| Field | Value |
|---|---|
| **Name** | WhyChooseUs |
| **File** | `src/components/home/Sections.tsx` |
| **Type** | Home section component |
| **Classification** | Static |
| **User Interactions** | None |
| **Dynamic Behavior** | Only `whileInView` / `whileHover` Framer Motion animations; no state or API |
| **Data Sources** | `whyChooseUs` from `src/data/mock.ts` (static) |
| **Evidence** | No `useState`, no hooks beyond Framer Motion; pure markup with `whyChooseUs.map(...)` |

---

#### 7. Offers (home sub-section)

| Field | Value |
|---|---|
| **Name** | Offers |
| **File** | `src/components/home/Sections.tsx` |
| **Type** | Home section component |
| **Classification** | Dynamic |
| **User Interactions** | "Copy" button copies coupon code to clipboard; "CTA Button" navigates to linked URL |
| **Dynamic Behavior** | Renders API-sourced offers; clipboard toast on copy; hides section entirely if no offers |
| **Data Sources** | `GET /api/offers/home` via `useHomeOffers()` |
| **Evidence** | `const { data: offers = [] } = useHomeOffers()` + `navigator.clipboard?.writeText(o.couponCode!)` |

---

#### 8. Reviews (home sub-section)

| Field | Value |
|---|---|
| **Name** | Reviews |
| **File** | `src/components/home/Sections.tsx` |
| **Type** | Home section component |
| **Classification** | Mixed |
| **User Interactions** | Dot nav buttons to jump to a specific review; auto-advances every 4 seconds |
| **Dynamic Behavior** | Spring-animated carousel with tripled array for smooth wrap; `setInterval` auto-play |
| **Data Sources** | `reviews` from `src/data/mock.ts` (static) |
| **Evidence** | `const duplicatedReviews = [...reviews, ...reviews, ...reviews]`; `setInterval(() => setI((prev) => …), 4000)` |

---

#### 9. GalleryStrip (home sub-section)

| Field | Value |
|---|---|
| **Name** | GalleryStrip |
| **File** | `src/components/home/GalleryFAQ.tsx` |
| **Type** | Home section component |
| **Classification** | Mixed |
| **User Interactions** | Hover reveals gradient overlay |
| **Dynamic Behavior** | `whileInView` scroll animation per image; no API calls |
| **Data Sources** | `galleryImages` from `src/data/mock.ts` (static) |
| **Evidence** | `import { galleryImages, faqs } from "@/data/mock"` |

---

#### 10. FAQ (home sub-section)

| Field | Value |
|---|---|
| **Name** | FAQ |
| **File** | `src/components/home/GalleryFAQ.tsx` |
| **Type** | Home section component |
| **Classification** | Mixed |
| **User Interactions** | Accordion expand/collapse per FAQ item (shadcn `Accordion`) |
| **Dynamic Behavior** | Accordion state managed by Radix UI; no API calls |
| **Data Sources** | `faqs` from `src/data/mock.ts` (static) |
| **Evidence** | `<Accordion type="single" collapsible>` with `faqs.map(...)` |

---

#### 11. CTA (home sub-section)

| Field | Value |
|---|---|
| **Name** | CTA |
| **File** | `src/components/home/Sections.tsx` |
| **Type** | Home section component |
| **Classification** | Static |
| **User Interactions** | "Order Online" link to `/menu`; "Book a Table" link to `/reservation` |
| **Dynamic Behavior** | None — static markup with Framer Motion entrance animation |
| **Data Sources** | None |
| **Evidence** | No hooks, no state; pure markup |

---

#### 12. AboutPage

| Field | Value |
|---|---|
| **Name** | AboutPage |
| **File** | `src/routes/about.tsx` |
| **Type** | Page (route `/about`) |
| **Classification** | Mixed |
| **User Interactions** | None interactive beyond scroll |
| **Dynamic Behavior** | `useScroll` + `useSpring` drives a vertical timeline progress bar; `useInView` per timeline item triggers fade-in; animated scroll-driven progress line |
| **Data Sources** | `timeline`, `teamMembers`, `stats` from `src/data/mock.ts` (static) |
| **Evidence** | `const { scrollYProgress } = useScroll({ target: timelineRef })`; `const scaleY = useSpring(scrollYProgress, …)` |

---

#### 13. ContactPage

| Field | Value |
|---|---|
| **Name** | ContactPage |
| **File** | `src/routes/contact.tsx` |
| **Type** | Page (route `/contact`) |
| **Classification** | Dynamic |
| **User Interactions** | Contact form (name, email, subject, message); submit button; branch cards render API data |
| **Dynamic Behavior** | `useState` form fields; `POST /api/contact` on submit; `useBranches()` for branch cards; lazy `WorldMap` component (`React.lazy` + `Suspense`) |
| **Data Sources** | `GET /api/locations` (branch cards), `POST /api/contact` (form submission) |
| **Evidence** | `const [form, setForm] = useState(...)` + `await apiFetch("/api/contact", { method: "POST", body: … })` |

---

#### 14. MenuPage

| Field | Value |
|---|---|
| **Name** | MenuPage |
| **File** | `src/routes/menu.index.tsx` |
| **Type** | Page (route `/menu`) |
| **Classification** | Dynamic |
| **User Interactions** | Category filter chips, search input, veg-only toggle, "Add to cart" per item, location prompt Dialog on first add |
| **Dynamic Behavior** | `useState` for `cat`, `q`, `vegOnly`, `showLocationPrompt`, `pendingItem`; real-time filtered menu items; location selection Dialog before first cart add; bilingual name/category via `useLocalized` |
| **Data Sources** | `GET /api/menu/items?category=...&q=...&veg=true&branchId=...` via `useMenuItems`, `GET /api/menu/categories` via `useMenuCategories`, `GET /api/locations` via `useBranches` |
| **Evidence** | `const { data: items = [] } = useMenuItems({ category: cat, q, veg: vegOnly, branchId })` |

---

#### 15. DishDetailsPage

| Field | Value |
|---|---|
| **Name** | DishDetailsPage |
| **File** | `src/routes/menu.$name.tsx` |
| **Type** | Page (route `/menu/:name`) |
| **Classification** | Dynamic |
| **User Interactions** | Quantity stepper (increment/decrement), "Add to Cart" button, location prompt dialog, related item cards |
| **Dynamic Behavior** | URL param `name` drives item fetch; `useState` for `showLocationPrompt`, `qty`; add-to-cart with branch selection guard |
| **Data Sources** | `GET /api/menu/items/:name?branchId=...` via `useMenuItem` (returns item + relatedItems) |
| **Evidence** | `const { name } = Route.useParams()` + `const { data } = useMenuItem(name, currentBranchId)` |

---

#### 16. ReservationPage

| Field | Value |
|---|---|
| **Name** | ReservationPage |
| **File** | `src/routes/reservation.tsx` |
| **Type** | Page (route `/reservation`) |
| **Classification** | Dynamic |
| **User Interactions** | Branch select, date/time inputs, GuestPicker (quick chips 1-5, stepper for 6+), contact form fields, submit; confirmation dialog (AnimatePresence); duplicate warning dialog with override option |
| **Dynamic Behavior** | Complex form state; `useCreateReservation` mutation; `useCustomerLookup` (debounced phone/email auto-fill); `GET /api/reservations/check-duplicate` for duplicate check; real-time time slot selection based on branch hours |
| **Data Sources** | `GET /api/locations`, `GET /api/reservations/check-duplicate`, `POST /api/reservations`, `GET /api/customers/lookup?phone=...` |
| **Evidence** | `const duplicate = await apiFetch(\`/api/reservations/check-duplicate?...\`)` + `useCreateReservation()` |

---

#### 17. CheckoutPage

| Field | Value |
|---|---|
| **Name** | CheckoutPage |
| **File** | `src/routes/checkout.tsx` |
| **Type** | Page (route `/checkout`) |
| **Classification** | Dynamic |
| **User Interactions** | 6-step wizard navigation (Next/Back), branch selection, order type toggle (Pickup/Delivery), contact form fields, delivery address form / saved address dialog, payment method selection, review and confirm |
| **Dynamic Behavior** | 6-step state machine via `useState(step)`; cart reads from `CartContext`; `useCustomerLookup` for auto-fill; `AddressSelectDialog` for saved addresses; `useCreateOrder` mutation; order confirmation overlay on success; `useNavigate` to order-tracking |
| **Data Sources** | `GET /api/locations`, `GET /api/customers/lookup`, `GET /api/addresses`, `POST /api/orders` |
| **Evidence** | `const [step, setStep] = useState(1)` (steps 1-6) + `useCreateOrder()` + `useCustomerLookup(phone, email)` |

---

#### 18. OffersPage

| Field | Value |
|---|---|
| **Name** | OffersPage |
| **File** | `src/routes/offers.tsx` |
| **Type** | Page (route `/offers`) |
| **Classification** | Dynamic |
| **User Interactions** | "Copy" button copies coupon code to clipboard; loading skeleton while fetching |
| **Dynamic Behavior** | `usePublicOffers` query; skeleton placeholders during load; toast on copy |
| **Data Sources** | `GET /api/offers` via `usePublicOffers()` |
| **Evidence** | `const { data: offers = [], isLoading } = usePublicOffers()` |

---

#### 19. TrackPage (Order Tracking)

| Field | Value |
|---|---|
| **Name** | TrackPage |
| **File** | `src/routes/order-tracking.tsx` |
| **Type** | Page (route `/order-tracking`) |
| **Classification** | Dynamic |
| **User Interactions** | Order ID search input (manual entry); animated stage indicators |
| **Dynamic Behavior** | Zod-validated `useSearch` for `?id=` URL param; `useOrder(id)` fetches order; supports numeric (API) or legacy localStorage orders; STAGE_KEYS array maps statuses to progress indicators |
| **Data Sources** | `GET /api/orders/:id` via `useOrder()`, or localStorage for legacy orders |
| **Evidence** | `const searchSchema = z.object({ id: z.string().optional() })`; `useOrder(search.id)` |

---

#### 20. GalleryPage

| Field | Value |
|---|---|
| **Name** | GalleryPage |
| **File** | `src/routes/gallery.tsx` |
| **Type** | Page (route `/gallery`) |
| **Classification** | Mixed |
| **User Interactions** | Click image to open lightbox; Escape or backdrop click to close |
| **Dynamic Behavior** | `useState` for `open` (selected image); `AnimatePresence` lightbox overlay |
| **Data Sources** | `galleryImages` from `src/data/mock.ts` (static) |
| **Evidence** | `const [open, setOpen] = useState<string | null>(null)` |

---

#### 21. LocationsPage

| Field | Value |
|---|---|
| **Name** | LocationsPage |
| **File** | `src/routes/locations.tsx` |
| **Type** | Page (route `/locations`) |
| **Classification** | Dynamic |
| **User Interactions** | "Reserve a Table" button opens inline reservation Dialog (full ReservationPage logic); Google Maps iframes; branch detail cards |
| **Dynamic Behavior** | Contains the full reservation form logic inline (same hooks as ReservationPage): `useCreateReservation`, `useCustomerLookup`, GuestPicker, duplicate check |
| **Data Sources** | `GET /api/locations`, `POST /api/reservations`, `GET /api/customers/lookup` |
| **Evidence** | `useBranches()`, `useCreateReservation()`, `useCustomerLookup(phone, email)` inline |

---

### Account Pages

---

#### 22. AccountLayout

| Field | Value |
|---|---|
| **Name** | AccountLayout |
| **File** | `src/routes/account.tsx` |
| **Type** | Layout page (route `/account`) |
| **Classification** | Dynamic |
| **User Interactions** | Sidebar navigation (NavItem links highlight active route), mobile tab chips, logout button |
| **Dynamic Behavior** | Auth guard: `useEffect` opens login modal if no user; `useRouterState` for active link detection; logout calls `AuthContext.logout()` then navigates to `/` |
| **Data Sources** | `AuthContext` (user state) |
| **Evidence** | `useEffect(() => { if (!user) openModal("login"); }, [user])` |

---

#### 23. AccountDashboard

| Field | Value |
|---|---|
| **Name** | AccountDashboard |
| **File** | `src/routes/account.index.tsx` |
| **Type** | Page (route `/account/`) |
| **Classification** | Dynamic |
| **User Interactions** | Quick links to orders, reservations, addresses, coupons |
| **Dynamic Behavior** | Displays stat cards (order count, reservation count, coupon count, address count); shows last order details and next upcoming reservation |
| **Data Sources** | `GET /api/orders/my`, `GET /api/reservations/my`, `GET /api/offers`, `GET /api/addresses` |
| **Evidence** | `useMyOrders()`, `useMyReservations()`, `usePublicOffers()`, `useAddresses()` |

---

#### 24. ProfilePage

| Field | Value |
|---|---|
| **Name** | ProfilePage |
| **File** | `src/routes/account.profile.tsx` |
| **Type** | Page (route `/account/profile`) |
| **Classification** | Dynamic |
| **User Interactions** | Edit first/last name, phone; email field is disabled; "Save Changes" button |
| **Dynamic Behavior** | `useState` pre-populated from `AuthContext.user`; `useUpdateProfile` mutation; `PUT /api/auth/profile` on save |
| **Data Sources** | `AuthContext` (initial values), `PUT /api/auth/profile` |
| **Evidence** | `const update = useUpdateProfile()` + `await update.mutateAsync(form)` |

---

#### 25. OrdersPage (account)

| Field | Value |
|---|---|
| **Name** | OrdersPage |
| **File** | `src/routes/account.orders.tsx` |
| **Type** | Page (route `/account/orders`) |
| **Classification** | Dynamic |
| **User Interactions** | Status badge display; "Track Order" link per order |
| **Dynamic Behavior** | Fetches user's order history; color-coded status badges; empty state |
| **Data Sources** | `GET /api/orders/my` via `useMyOrders()` |
| **Evidence** | `const { data: orders = [], isLoading } = useMyOrders()` |

---

#### 26. ReservationsPage (account)

| Field | Value |
|---|---|
| **Name** | ReservationsPage |
| **File** | `src/routes/account.reservations.tsx` |
| **Type** | Page (route `/account/reservations`) |
| **Classification** | Dynamic |
| **User Interactions** | Status badge display (Confirmed/Pending) |
| **Dynamic Behavior** | Fetches user's reservations; color-coded status; empty state |
| **Data Sources** | `GET /api/reservations/my` via `useMyReservations()` |
| **Evidence** | `const { data: reservations = [], isLoading } = useMyReservations()` |

---

#### 27. AddressesPage

| Field | Value |
|---|---|
| **Name** | AddressesPage |
| **File** | `src/routes/account.addresses.tsx` |
| **Type** | Page (route `/account/addresses`) |
| **Classification** | Dynamic |
| **User Interactions** | Add address (opens Dialog), edit address (opens Dialog), delete address (inline); type select (Home/Office/Other) in form |
| **Dynamic Behavior** | Full CRUD: `useAddresses`, `useAddAddress`, `useUpdateAddress`, `useDeleteAddress`; Dialog open state via `useState` |
| **Data Sources** | `GET /api/addresses`, `POST /api/addresses`, `PUT /api/addresses/:id`, `DELETE /api/addresses/:id` |
| **Evidence** | `const add = useAddAddress(); const update = useUpdateAddress(); const del = useDeleteAddress()` |

---

#### 28. CouponsPage (account)

| Field | Value |
|---|---|
| **Name** | CouponsPage |
| **File** | `src/routes/account.coupons.tsx` |
| **Type** | Page (route `/account/coupons`) |
| **Classification** | Dynamic |
| **User Interactions** | "Copy code" button per coupon |
| **Dynamic Behavior** | Loads public offers; displays each with discount label and expiry; clipboard copy with toast |
| **Data Sources** | `GET /api/offers` via `usePublicOffers()` |
| **Evidence** | `const { data: offers = [], isLoading } = usePublicOffers()` |

---

### Admin Pages

---

#### 29. AdminLayout

| Field | Value |
|---|---|
| **Name** | AdminLayout |
| **File** | `src/routes/admin.tsx` |
| **Type** | Layout page (route `/admin`) |
| **Classification** | Dynamic |
| **User Interactions** | Email/password login form (show/hide password toggle); sidebar navigation with collapsible sections; mobile hamburger drawer |
| **Dynamic Behavior** | Shows `AdminLoginForm` if not authenticated or not admin; calls `AuthContext.login()` on submit; `isAdminUser()` checks role; mobile `Sheet` drawer |
| **Data Sources** | `AuthContext` (login mutation → `POST /api/auth/login`) |
| **Evidence** | `const { user, login, isAdminUser } = useAuth()` + `if (!user || !isAdminUser()) return <AdminLoginForm />` |

---

#### 30. AdminDashboard

| Field | Value |
|---|---|
| **Name** | AdminDashboard |
| **File** | `src/routes/admin.index.tsx` |
| **Type** | Page (route `/admin/`) |
| **Classification** | Dynamic |
| **User Interactions** | Quick link cards navigate to admin sub-sections |
| **Dynamic Behavior** | Polls `/api/admin/dashboard` every 30 seconds (`refetchInterval: 30_000`); 6 stat cards (today orders, revenue, pending, reservations, total orders, total revenue) |
| **Data Sources** | `GET /api/admin/dashboard` via `useAdminDashboard()` (auto-refresh every 30s) |
| **Evidence** | `const { data: stats } = useAdminDashboard()` with `refetchInterval: 30_000` in hook |

---

#### 31. AdminOrders

| Field | Value |
|---|---|
| **Name** | AdminOrders |
| **File** | `src/routes/admin.orders.tsx` |
| **Type** | Page (route `/admin/orders`) |
| **Classification** | Dynamic |
| **User Interactions** | Status filter Select, branch filter Select, expand row to see contact/items/delivery, inline status update Select per order |
| **Dynamic Behavior** | `useAdminOrders` with status+branch params; `useUpdateOrderStatus` mutation; expanded row with full order details; status color badges |
| **Data Sources** | `GET /api/admin/orders?status=...&branchId=...`, `PATCH /api/admin/orders/:id/status` |
| **Evidence** | `const { data: orders = [] } = useAdminOrders({ status: filter, branchId })` + `useUpdateOrderStatus()` |

---

#### 32. AdminReservations

| Field | Value |
|---|---|
| **Name** | AdminReservations |
| **File** | `src/routes/admin.reservations.tsx` |
| **Type** | Page (route `/admin/reservations`) |
| **Classification** | Dynamic |
| **User Interactions** | Status/branch/date filter inputs; expand row; Confirm/Cancel action buttons per reservation |
| **Dynamic Behavior** | `useAdminReservations` with filters; `useUpdateReservationStatus` mutation; expanded row with contact info and special requests |
| **Data Sources** | `GET /api/admin/reservations?status=...&branchId=...&date=...`, `PATCH /api/admin/reservations/:id/status` |
| **Evidence** | `useAdminReservations({ status, branchId, date })` + `useUpdateReservationStatus()` |

---

#### 33. AdminCustomers

| Field | Value |
|---|---|
| **Name** | AdminCustomers |
| **File** | `src/routes/admin.customers.tsx` |
| **Type** | Page (route `/admin/customers`) |
| **Classification** | Dynamic |
| **User Interactions** | Search input (debounced query param); click row to open `CustomerHistoryDialog`; date preset tabs (Today/Yesterday/This Week/Last Week/This Month/Last Month/Custom); date range picker; Orders / Reservations tabs |
| **Dynamic Behavior** | `useAdminCustomers(q)` list + `useAdminCustomerDetail(id)` on row click; dialog with Tabs component; expandable `OrderCard` |
| **Data Sources** | `GET /api/admin/customers?q=...`, `GET /api/admin/customers/:id` |
| **Evidence** | `useAdminCustomers(searchQ)` + `useAdminCustomerDetail(selectedId)` |

---

#### 34. AdminMenuIndex

| Field | Value |
|---|---|
| **Name** | AdminMenuIndex |
| **File** | `src/routes/admin.menu.index.tsx` |
| **Type** | Page (route `/admin/menu`) |
| **Classification** | Dynamic |
| **User Interactions** | Branch filter Select; expand row for price breakdown; delete button (ConfirmDialog); edit link |
| **Dynamic Behavior** | `useAdminMenuItems` list; `useDeleteMenuItem` mutation; `ConfirmDialog` for delete; `PriceBreakdown` expandable sub-row |
| **Data Sources** | `GET /api/admin/menu-items`, `DELETE /api/admin/menu-items/:id` |
| **Evidence** | `useAdminMenuItems()` + `useDeleteMenuItem()` |

---

#### 35. MenuItemNewPage

| Field | Value |
|---|---|
| **Name** | MenuItemNewPage |
| **File** | `src/routes/admin.menu.new.tsx` |
| **Type** | Page (route `/admin/menu/new`) |
| **Classification** | Dynamic |
| **User Interactions** | Bilingual name/description inputs, spicy level selector, vegetarian checkbox, `ImagePicker` (file upload or URL), menu checkboxes, `BranchMultiSelect`, per-branch price inputs |
| **Dynamic Behavior** | `useCreateMenuItem` mutation; `ImagePicker` uses `useUploadImage` for file upload; `useBranches` populates branch list |
| **Data Sources** | `POST /api/admin/menu-items`, `POST /api/admin/upload/image` |
| **Evidence** | `const create = useCreateMenuItem()` + `<ImagePicker value={form.imageUrl} onChange={...} />` |

---

#### 36. MenuItemEditPage

| Field | Value |
|---|---|
| **Name** | MenuItemEditPage |
| **File** | `src/routes/admin.menu.$itemId.tsx` |
| **Type** | Page (route `/admin/menu/:itemId`) |
| **Classification** | Dynamic |
| **User Interactions** | Same fields as New + Signature Dish Switch toggle |
| **Dynamic Behavior** | Pre-populates from `useAdminMenuItems`; `useUpdateMenuItem` + `useUpdateMenuItemPrices` mutations |
| **Data Sources** | `GET /api/admin/menu-items`, `PUT /api/admin/menu-items/:id`, `PUT /api/admin/menu-items/:id/prices` |
| **Evidence** | `useUpdateMenuItem()` + `useUpdateMenuItemPrices()` |

---

#### 37. AdminMenusIndex

| Field | Value |
|---|---|
| **Name** | AdminMenusIndex |
| **File** | `src/routes/admin.menus.index.tsx` |
| **Type** | Page (route `/admin/menus`) |
| **Classification** | Dynamic |
| **User Interactions** | `InlineStatusSelect` toggle Active/Inactive, delete (ConfirmDialog), edit link |
| **Dynamic Behavior** | `useAdminMenus` list; `useToggleMenu` mutation; `useDeleteMenu` mutation |
| **Data Sources** | `GET /api/admin/menus`, `PATCH /api/admin/menus/:id/toggle`, `DELETE /api/admin/menus/:id` |
| **Evidence** | `useAdminMenus()` + `useToggleMenu()` + `useDeleteMenu()` |

---

#### 38. MenuNewPage

| Field | Value |
|---|---|
| **Name** | MenuNewPage |
| **File** | `src/routes/admin.menus.new.tsx` |
| **Type** | Page (route `/admin/menus/new`) |
| **Classification** | Dynamic |
| **User Interactions** | Bilingual name/description inputs, `BranchMultiSelect` |
| **Dynamic Behavior** | `useCreateMenu` mutation; on success navigates to edit page |
| **Data Sources** | `POST /api/admin/menus` |
| **Evidence** | `const create = useCreateMenu()` + `navigate({ to: "/admin/menus/$menuId", params: { menuId: String(res.id) } })` |

---

#### 39. MenuEditPage

| Field | Value |
|---|---|
| **Name** | MenuEditPage |
| **File** | `src/routes/admin.menus.$menuId.tsx` |
| **Type** | Page (route `/admin/menus/:menuId`) |
| **Classification** | Dynamic |
| **User Interactions** | Bilingual fields, `BranchMultiSelect`, item search/add picker, up/down reorder buttons, unlink item (ConfirmDialog) |
| **Dynamic Behavior** | `useUpdateMenu`, `useAddItemToMenu`, `useRemoveItemFromMenu`, `useReorderMenuItems` mutations; item search with debounced `useState(q)` |
| **Data Sources** | `GET /api/admin/menus`, `PUT /api/admin/menus/:id`, `POST /api/admin/menus/:id/items`, `DELETE /api/admin/menus/:id/items/:itemId`, `PUT /api/admin/menus/:id/items/reorder` |
| **Evidence** | 4 mutation hooks + `const [q, setQ] = useState("")` for item search |

---

#### 40. AdminOffersIndex

| Field | Value |
|---|---|
| **Name** | AdminOffersIndex |
| **File** | `src/routes/admin.offers.index.tsx` |
| **Type** | Page (route `/admin/offers`) |
| **Classification** | Dynamic |
| **User Interactions** | `InlineStatusSelect` toggle, delete (ConfirmDialog), edit link |
| **Dynamic Behavior** | `useAdminOffers` list; `useToggleOffer` and `useDeleteOffer` mutations |
| **Data Sources** | `GET /api/admin/offers`, `PATCH /api/admin/offers/:id/toggle`, `DELETE /api/admin/offers/:id` |
| **Evidence** | `useAdminOffers()` + `useToggleOffer()` + `useDeleteOffer()` |

---

#### 41. OfferNewPage / OfferEditPage

| Field | Value |
|---|---|
| **Name** | OfferNewPage / OfferEditPage |
| **File** | `src/routes/admin.offers.new.tsx` / `src/routes/admin.offers.$offerId.tsx` |
| **Type** | Pages (route `/admin/offers/new`, `/admin/offers/:offerId`) |
| **Classification** | Dynamic |
| **User Interactions** | Title, description, discount type/value, coupon code, min order, usage limit, date range pickers, `ImagePicker`, badge text, validity text, CTA text/link, Show on Home `Switch`, First Order Only checkbox |
| **Dynamic Behavior** | Shared `OfferFormFields` component; create uses `useCreateOffer`; edit pre-populates from `useAdminOffers` and uses `useUpdateOffer` |
| **Data Sources** | `POST /api/admin/offers`, `PUT /api/admin/offers/:id`, `POST /api/admin/upload/image` |
| **Evidence** | `export function OfferFormFields(...)` shared between both pages |

---

#### 42. AdminBranchesIndex

| Field | Value |
|---|---|
| **Name** | AdminBranchesIndex |
| **File** | `src/routes/admin.branches.index.tsx` |
| **Type** | Page (route `/admin/branches`) |
| **Classification** | Dynamic |
| **User Interactions** | Edit link per branch (no delete) |
| **Dynamic Behavior** | `useAdminBranches` list displayed in DataTable |
| **Data Sources** | `GET /api/admin/branches` |
| **Evidence** | `const { data: branches = [] } = useAdminBranches()` |

---

#### 43. BranchNewPage / BranchEditPage

| Field | Value |
|---|---|
| **Name** | BranchNewPage / BranchEditPage |
| **File** | `src/routes/admin.branches.new.tsx` / `src/routes/admin.branches.$branchId.tsx` |
| **Type** | Pages (route `/admin/branches/new`, `/admin/branches/:branchId`) |
| **Classification** | Dynamic |
| **User Interactions** | `BranchFields`: name, address fields, weekday/weekend open/close times, `ImagePicker`, rating, review count, Google Maps link, phone, email |
| **Dynamic Behavior** | Shared `BranchFields` component; create uses `useCreateBranch`; edit uses `useUpdateBranch` |
| **Data Sources** | `POST /api/admin/branches`, `PUT /api/admin/branches/:id`, `POST /api/admin/upload/image` |
| **Evidence** | `useCreateBranch()` / `useUpdateBranch()` |

---

### Shared Components

---

#### 44. Header

| Field | Value |
|---|---|
| **Name** | Header |
| **File** | `src/components/Header.tsx` |
| **Type** | Shared layout component |
| **Classification** | Dynamic |
| **User Interactions** | 7 nav links, language switcher DropdownMenu (DA/EN), branch selector DropdownMenu, user DropdownMenu (login/register/logout/profile), cart badge button opens `CartContext`, mobile hamburger opens fullscreen AnimatePresence drawer |
| **Dynamic Behavior** | Scroll detection (`window.scrollY > 30`) changes header opacity/blur; `useAuth()` for user state and modal triggers; `useCart()` for `totalQty` badge; `useI18n()` for language switch |
| **Data Sources** | `AuthContext`, `CartContext`, `I18nContext`, scroll events |
| **Evidence** | `const { user, openModal, logout } = useAuth()` + `const { totalQty, setBranch } = useCart()` + `useEffect(() => { window.addEventListener("scroll", ...) })` |

---

#### 45. CartDrawer

| Field | Value |
|---|---|
| **Name** | CartDrawer |
| **File** | `src/components/CartDrawer.tsx` |
| **Type** | Shared component |
| **Classification** | Dynamic |
| **User Interactions** | +/- quantity buttons, trash/remove button, coupon code input + Apply button, checkout Link button |
| **Dynamic Behavior** | `CartContext.open` drives `AnimatePresence`; coupon validation against local COUPONS map (WELCOME10/FAMILY20/FREEDELIVERY) AND API offers (via `usePublicOffers`); `OrderSummary` with live totals |
| **Data Sources** | `CartContext`, `GET /api/offers` via `usePublicOffers` |
| **Evidence** | `const { open, lines, subtotal, … coupon, applyCoupon } = useCart()` + coupon validation against `apiOffers.find(...)` |

---

#### 46. AuthModal

| Field | Value |
|---|---|
| **Name** | AuthModal |
| **File** | `src/components/AuthModal.tsx` |
| **Type** | Shared component (global modal) |
| **Classification** | Dynamic |
| **User Interactions** | Login form (email + password), register form (first/last name, email, password, phone), forgot-password 3-step flow (enter email → enter OTP → new password); mode-switching links |
| **Dynamic Behavior** | `AnimatePresence` modal; 3 `modalMode` states (`login`/`register`/`forgot`); forgot has internal `forgotStep` 1-3; calls `AuthContext.login`, `AuthContext.register`; direct `apiFetch` calls for forgot/reset |
| **Data Sources** | `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` |
| **Evidence** | `const { modalOpen, modalMode, login, register, closeModal } = useAuth()` + `apiFetch("/api/auth/forgot-password", ...)` |

---

#### 47. Footer

| Field | Value |
|---|---|
| **Name** | Footer |
| **File** | `src/components/Footer.tsx` |
| **Type** | Shared layout component |
| **Classification** | Dynamic |
| **User Interactions** | Nav links, social media icon links (Facebook/Instagram/Twitter), phone/email contact info |
| **Dynamic Behavior** | Renders live branch addresses and phone numbers from API |
| **Data Sources** | `GET /api/locations` via `useBranches()` |
| **Evidence** | `const { data: branchesData = [] } = useBranches()` |

---

#### 48. Layout

| Field | Value |
|---|---|
| **Name** | Layout |
| **File** | `src/components/Layout.tsx` |
| **Type** | Shared layout wrapper |
| **Classification** | Mixed |
| **User Interactions** | Scroll-to-top FAB (appears after 400px scroll), WhatsApp FAB, phone call FAB |
| **Dynamic Behavior** | `useState(showScrollTop)`; scroll event listener; `AnimatePresence` on scroll-to-top button |
| **Data Sources** | Scroll events only |
| **Evidence** | `setShowScrollTop(window.scrollY > 400)` |

---

#### 49. PageHero

| Field | Value |
|---|---|
| **Name** | PageHero |
| **File** | `src/components/PageHero.tsx` |
| **Type** | Shared component |
| **Classification** | Static |
| **User Interactions** | None |
| **Dynamic Behavior** | Framer Motion entrance animations only; purely presentational |
| **Data Sources** | Props only (`eyebrow`, `title`, `subtitle`, `image`) |
| **Evidence** | No hooks, no state; `motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}` |

---

#### 50. AddressSelectDialog

| Field | Value |
|---|---|
| **Name** | AddressSelectDialog |
| **File** | `src/components/AddressSelectDialog.tsx` |
| **Type** | Shared component |
| **Classification** | Static (pure UI — state lives in parent) |
| **User Interactions** | Click saved address to select, "Enter a new address" button |
| **Dynamic Behavior** | No own state or API calls; callbacks `onSelect` and `onNew` passed from parent |
| **Data Sources** | `addresses` prop (array of `CustomerAddress`) |
| **Evidence** | No `useState`, no hooks; `onClick={() => { onSelect(addr); onOpenChange(false); }}` |

---

#### 51. ImagePicker (admin)

| Field | Value |
|---|---|
| **Name** | ImagePicker |
| **File** | `src/components/admin/ImagePicker.tsx` |
| **Type** | Admin sub-component |
| **Classification** | Dynamic |
| **User Interactions** | Click to open file picker, drag-drop, clear button, URL paste input |
| **Dynamic Behavior** | `useUploadImage` mutation; `upload.isPending` shows spinner overlay; resolves relative URLs using `BASE` constant |
| **Data Sources** | `POST /api/admin/upload/image` (multipart form data) |
| **Evidence** | `const upload = useUploadImage()` + `const url = await upload.mutateAsync(file)` |

---

#### 52. BranchMultiSelect (admin)

| Field | Value |
|---|---|
| **Name** | BranchMultiSelect |
| **File** | `src/components/admin/BranchMultiSelect.tsx` |
| **Type** | Admin sub-component |
| **Classification** | Static (pure UI) |
| **User Interactions** | Toggle-chip buttons to include/exclude branches |
| **Dynamic Behavior** | No own state; `toggle` function calls `onChange` prop |
| **Data Sources** | `branches` prop |
| **Evidence** | No hooks; `const toggle = (id: number) => onChange(selected.includes(id) ? ...)` |

---

#### 53. ConfirmDialog (admin)

| Field | Value |
|---|---|
| **Name** | ConfirmDialog |
| **File** | `src/components/admin/ConfirmDialog.tsx` |
| **Type** | Admin sub-component |
| **Classification** | Static (pure UI) |
| **User Interactions** | Confirm / Cancel buttons |
| **Dynamic Behavior** | Wraps shadcn `AlertDialog`; all state in parent |
| **Data Sources** | Props only |
| **Evidence** | No hooks; pure Radix AlertDialog wrapper |

---

#### 54. InlineStatusSelect (admin)

| Field | Value |
|---|---|
| **Name** | InlineStatusSelect |
| **File** | `src/components/admin/InlineStatusSelect.tsx` |
| **Type** | Admin sub-component |
| **Classification** | Static (pure UI) |
| **User Interactions** | Select Active/Inactive; calls `onToggle` on change |
| **Dynamic Behavior** | No own state; styled `<select>` with green/red colors |
| **Data Sources** | `active` prop |
| **Evidence** | No hooks; `onChange={onToggle}` |

---

#### 55. FormPage (admin)

| Field | Value |
|---|---|
| **Name** | FormPage |
| **File** | `src/components/admin/FormPage.tsx` |
| **Type** | Admin sub-component |
| **Classification** | Static |
| **User Interactions** | Back button (Link to `backTo`) |
| **Dynamic Behavior** | None — purely a layout wrapper |
| **Data Sources** | Props only |
| **Evidence** | No hooks; `<Link to={backTo}>` |

---

#### 56. OrderSummary

| Field | Value |
|---|---|
| **Name** | OrderSummary |
| **File** | `src/components/OrderSummary.tsx` |
| **Type** | Shared component |
| **Classification** | Static |
| **User Interactions** | None |
| **Dynamic Behavior** | `useI18n()` for label translations; purely presentational price breakdown |
| **Data Sources** | Numeric props (subtotal, discount, tax, delivery, total) |
| **Evidence** | `const { t } = useI18n()` — only i18n hook, no API or state |

---

#### 57. MenuItemPhoto

| Field | Value |
|---|---|
| **Name** | MenuItemPhoto |
| **File** | `src/components/MenuItemPhoto.tsx` |
| **Type** | Shared component |
| **Classification** | Mixed |
| **User Interactions** | None |
| **Dynamic Behavior** | `useState(failed)` tracks image load error; shows `Placeholder` on error or missing URL; resolves relative paths with `BASE` |
| **Data Sources** | `src` prop |
| **Evidence** | `const [failed, setFailed] = useState(false)` + `onError={() => setFailed(true)}` |

---

#### 58. SectionHeading

| Field | Value |
|---|---|
| **Name** | SectionHeading |
| **File** | `src/components/home/Branches.tsx` |
| **Type** | Shared sub-component |
| **Classification** | Static |
| **User Interactions** | None |
| **Dynamic Behavior** | Framer Motion entrance animations only |
| **Data Sources** | Props only |
| **Evidence** | No hooks; `motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}` |

---

## Section 4: User Interaction Inventory

| Interaction Type | Count | Where |
|---|---|---|
| Form submission (POST/PUT mutation) | 14 | Contact form, Reservation form (×2), Checkout order, Login, Register, Forgot password (3 steps), Reset password, Profile update, Add/Edit address, Create/Edit menu item, Create/Edit menu, Create/Edit offer, Create/Edit branch |
| Add to cart | 3 | FeaturedMenu carousel, MenuPage item card, DishDetailsPage |
| Cart quantity adjust (+/-) | 1 | CartDrawer |
| Cart item remove | 1 | CartDrawer |
| Coupon code apply | 1 | CartDrawer |
| Copy to clipboard (coupon) | 4 | CartDrawer coupon, Offers home section, OffersPage, CouponsPage (account) |
| Link/navigation click | 30+ | Nav links, CTAs, "View →", "Track Order", back buttons, admin quick links |
| Modal open/close | 8 | AuthModal (login/register/forgot), CartDrawer, AddressSelectDialog, LocationsPage reservation Dialog, AdminCustomers history Dialog, ConfirmDialog (×multiple), ReservationPage confirmation/duplicate dialogs |
| Filter / search input | 7 | MenuPage (category, search, veg toggle), AdminOrders (status, branch), AdminReservations (status, branch, date), AdminCustomers (search), AdminMenuIndex (branch filter), AdminMenus (n/a), AdminMenusEdit (item search) |
| Carousel navigation (prev/next dots) | 3 | Hero slideshow, FeaturedMenu carousel, Reviews carousel |
| Accordion expand/collapse | 1 | FAQ section |
| Image upload (file pick) | 2 | ImagePicker in offer form, menu item form, branch form |
| Inline status toggle | 2 | AdminMenusIndex (toggle menu active), AdminOffersIndex (toggle offer active) |
| Status update select | 2 | AdminOrders (per-order), AdminReservations (Confirm/Cancel buttons) |
| Delete with confirmation | 3 | AdminMenuIndex (delete item), AdminMenusIndex (delete menu), AdminOffersIndex (delete offer) |
| Lightbox open/close | 1 | GalleryPage |
| Row expand (DataTable) | 3 | AdminOrders, AdminReservations, AdminMenuIndex |
| Quantity stepper (reservation) | 1 | ReservationPage GuestPicker |
| Language switch | 1 | Header DropdownMenu |
| Branch switch | 1 | Header DropdownMenu |
| Logout | 2 | Header user menu, AccountLayout sidebar |
| Scroll to top FAB | 1 | Layout component |
| WhatsApp / Phone FAB | 2 | Layout component |
| Reorder items (up/down) | 1 | MenuEditPage item list |
| Item add to menu | 1 | MenuEditPage item picker |
| Item unlink from menu | 1 | MenuEditPage (ConfirmDialog) |
| Auth mode switch | 3 | AuthModal (login ↔ register ↔ forgot) |

---

## Section 5: Dynamic Components Table

| Name | File | Data Source | Key Interactions |
|---|---|---|---|
| Branches (home) | `components/home/Branches.tsx` | `GET /api/locations` | View link to /locations |
| FeaturedMenu | `components/home/Sections.tsx` | `GET /api/menu/items?signature=true` | Add to cart, carousel prev/next |
| Offers (home) | `components/home/Sections.tsx` | `GET /api/offers/home` | Copy coupon, CTA link |
| Footer | `components/Footer.tsx` | `GET /api/locations` | Branch contact info display |
| Header | `components/Header.tsx` | `AuthContext`, `CartContext`, scroll events | Language switch, branch switch, cart open, login/logout, mobile drawer |
| CartDrawer | `components/CartDrawer.tsx` | `CartContext`, `GET /api/offers` | Qty adjust, remove, coupon apply, checkout |
| AuthModal | `components/AuthModal.tsx` | `POST /api/auth/*` | Login, register, forgot/reset password |
| ImagePicker | `components/admin/ImagePicker.tsx` | `POST /api/admin/upload/image` | File pick, URL paste, clear |
| MenuPage | `routes/menu.index.tsx` | `GET /api/menu/items`, `GET /api/menu/categories`, `GET /api/locations` | Filter, search, veg toggle, add to cart, location prompt |
| DishDetailsPage | `routes/menu.$name.tsx` | `GET /api/menu/items/:name` | Qty stepper, add to cart |
| ReservationPage | `routes/reservation.tsx` | `GET /api/locations`, `POST /api/reservations`, `GET /api/reservations/check-duplicate`, `GET /api/customers/lookup` | Full reservation form, duplicate check, confirmation |
| LocationsPage | `routes/locations.tsx` | Same as ReservationPage + Google Maps iframes | Inline reservation dialog, maps |
| CheckoutPage | `routes/checkout.tsx` | `GET /api/locations`, `GET /api/customers/lookup`, `GET /api/addresses`, `POST /api/orders` | 6-step wizard, address select, order submit |
| ContactPage | `routes/contact.tsx` | `POST /api/contact`, `GET /api/locations` | Contact form, branch display |
| OffersPage | `routes/offers.tsx` | `GET /api/offers` | Copy coupon |
| TrackPage | `routes/order-tracking.tsx` | `GET /api/orders/:id` | Order ID input, stage display |
| AccountDashboard | `routes/account.index.tsx` | `GET /api/orders/my`, `GET /api/reservations/my`, `GET /api/offers`, `GET /api/addresses` | Stat cards, quick links |
| ProfilePage | `routes/account.profile.tsx` | `PUT /api/auth/profile` | Edit profile fields, save |
| OrdersPage (account) | `routes/account.orders.tsx` | `GET /api/orders/my` | Track order link |
| ReservationsPage (account) | `routes/account.reservations.tsx` | `GET /api/reservations/my` | Status display |
| AddressesPage | `routes/account.addresses.tsx` | `GET/POST/PUT/DELETE /api/addresses` | Add, edit, delete address |
| CouponsPage (account) | `routes/account.coupons.tsx` | `GET /api/offers` | Copy coupon code |
| AdminDashboard | `routes/admin.index.tsx` | `GET /api/admin/dashboard` (poll 30s) | Stat cards, quick links |
| AdminOrders | `routes/admin.orders.tsx` | `GET /api/admin/orders`, `PATCH /api/admin/orders/:id/status` | Filter, expand row, status update |
| AdminReservations | `routes/admin.reservations.tsx` | `GET /api/admin/reservations`, `PATCH /api/admin/reservations/:id/status` | Filter, expand, Confirm/Cancel |
| AdminCustomers | `routes/admin.customers.tsx` | `GET /api/admin/customers`, `GET /api/admin/customers/:id` | Search, history dialog, date presets |
| AdminMenuIndex | `routes/admin.menu.index.tsx` | `GET /api/admin/menu-items`, `DELETE /api/admin/menu-items/:id` | Branch filter, expand, delete |
| MenuItemNewPage | `routes/admin.menu.new.tsx` | `POST /api/admin/menu-items`, `POST /api/admin/upload/image` | Full item create form, image upload |
| MenuItemEditPage | `routes/admin.menu.$itemId.tsx` | `PUT /api/admin/menu-items/:id`, `PUT /api/admin/menu-items/:id/prices` | Edit + signature toggle |
| AdminMenusIndex | `routes/admin.menus.index.tsx` | `GET /api/admin/menus`, toggle/delete mutations | Status toggle, delete |
| MenuNewPage | `routes/admin.menus.new.tsx` | `POST /api/admin/menus` | Create menu form |
| MenuEditPage | `routes/admin.menus.$menuId.tsx` | `GET/PUT /api/admin/menus/:id`, item mutations | Edit, add/remove/reorder items |
| AdminOffersIndex | `routes/admin.offers.index.tsx` | `GET /api/admin/offers`, toggle/delete | Status toggle, delete |
| OfferNewPage | `routes/admin.offers.new.tsx` | `POST /api/admin/offers` | Full offer create form |
| OfferEditPage | `routes/admin.offers.$offerId.tsx` | `PUT /api/admin/offers/:id` | Edit offer |
| AdminBranchesIndex | `routes/admin.branches.index.tsx` | `GET /api/admin/branches` | Edit link |
| BranchNewPage | `routes/admin.branches.new.tsx` | `POST /api/admin/branches` | Create branch form |
| BranchEditPage | `routes/admin.branches.$branchId.tsx` | `PUT /api/admin/branches/:id` | Edit branch |

---

## Section 6: Static Components Table

| Name | File | Notes |
|---|---|---|
| WhyChooseUs | `components/home/Sections.tsx` | 4-card section from mock data; Framer Motion only |
| CTA | `components/home/Sections.tsx` | Call-to-action banner with two Link buttons; no state |
| PageHero | `components/PageHero.tsx` | Hero banner; props-driven; entrance animations only |
| SectionHeading | `components/home/Branches.tsx` | Reusable eyebrow/title/subtitle; props-driven |
| OrderSummary | `components/OrderSummary.tsx` | Price breakdown display; uses `useI18n` for labels but no API/state |
| FormPage | `components/admin/FormPage.tsx` | Admin form layout wrapper; back Link; no logic |
| BranchMultiSelect | `components/admin/BranchMultiSelect.tsx` | Controlled toggle-chip UI; state lives in parent |
| ConfirmDialog | `components/admin/ConfirmDialog.tsx` | AlertDialog wrapper; all control in parent |
| InlineStatusSelect | `components/admin/InlineStatusSelect.tsx` | Styled `<select>` with callback; no own state |
| AddressSelectDialog | `components/AddressSelectDialog.tsx` | Dialog wrapper; all logic in parent (CheckoutPage) |

---

## Section 7: Summary Statistics

### Component Counts

| Category | Count |
|---|---|
| Total route-level pages | 31 |
| Total shared/layout components | 12 |
| Total home section sub-components | 9 |
| Total admin sub-components | 5 |
| Total custom hooks | 43 |
| Total context providers | 3 |
| API endpoints consumed (distinct) | 38 |

### Classification Breakdown (Pages + Major Components)

| Classification | Count | Percentage |
|---|---|---|
| Dynamic | 38 | 88% |
| Mixed | 4 | 9% |
| Static | 1 | 3% |
| **Total** | **43** | **100%** |

> **Note:** "Dynamic" = at least one `useQuery`/`useMutation`/`useState` with meaningful state. "Mixed" = primarily static structure with some dynamic data or minor interaction (Hero, About, GalleryPage, GalleryStrip). "Static" = WhyChooseUs — pure markup from mock data with only Framer Motion.

### Most Complex Components

| Rank | Component | Complexity Drivers |
|---|---|---|
| 1 | **CheckoutPage** (`routes/checkout.tsx`) | 6-step state machine, 4 API calls, address dialog, customer lookup, cart integration |
| 2 | **ReservationPage** (`routes/reservation.tsx`) | Duplicate-check API, customer lookup, GuestPicker, AnimatePresence dialogs, time slot logic |
| 3 | **AuthModal** (`components/AuthModal.tsx`) | 3 auth modes, 3-step OTP forgot-password flow, 4 POST endpoints |
| 4 | **MenuEditPage** (`routes/admin.menus.$menuId.tsx`) | 4 mutation hooks, item search, reorder logic, unlink confirm |
| 5 | **AdminCustomers** (`routes/admin.customers.tsx`) | Dual query (list + detail), CustomerHistoryDialog, date presets, Tabs, expandable OrderCards |
| 6 | **CartDrawer** (`components/CartDrawer.tsx`) | Dual coupon validation (local map + API), live totals from CartContext, AnimatePresence |
| 7 | **MenuPage** (`routes/menu.index.tsx`) | 5 state vars, 3 queries, bilingual display, location prompt flow |
| 8 | **AdminOrders** (`routes/admin.orders.tsx`) | Filterable DataTable, expandable rows, inline status mutation, full order detail view |

### Data Source Breakdown

| Data Source | Components/Pages Using It |
|---|---|
| `GET /api/locations` | Branches, Footer, ContactPage, ReservationPage, LocationsPage, CheckoutPage, AdminLayout (indirect) |
| `GET /api/menu/items` | MenuPage, DishDetailsPage, FeaturedMenu, AdminMenuIndex |
| `GET /api/offers` / `GET /api/offers/home` | Offers section, OffersPage, CouponsPage, CartDrawer |
| `GET /api/orders/my` | AccountDashboard, OrdersPage |
| `GET /api/reservations/my` | AccountDashboard, ReservationsPage |
| `GET /api/addresses` | AddressesPage, AccountDashboard, CheckoutPage |
| `GET /api/customers/lookup` | ReservationPage, LocationsPage, CheckoutPage |
| `POST /api/orders` | CheckoutPage |
| `POST /api/reservations` | ReservationPage, LocationsPage |
| `GET /api/admin/dashboard` | AdminDashboard |
| `GET /api/admin/orders` | AdminOrders |
| `GET /api/admin/reservations` | AdminReservations |
| `GET /api/admin/customers` | AdminCustomers |
| `GET /api/admin/menu-items` | AdminMenuIndex, MenuItemEditPage |
| `GET /api/admin/menus` | AdminMenusIndex, MenuEditPage |
| `GET /api/admin/offers` | AdminOffersIndex, OfferEditPage |
| `GET /api/admin/branches` | AdminBranchesIndex, BranchEditPage |
| `POST /api/admin/upload/image` | ImagePicker (used in offer, menu item, branch forms) |
| `POST /api/auth/*` | AuthModal, ProfilePage |
| Mock data only | Hero, WhyChooseUs, CTA, Reviews, GalleryStrip, FAQ, AboutPage |

### API Mutation Summary

| Endpoint | Method | Hook | Used By |
|---|---|---|---|
| `/api/auth/login` | POST | `AuthContext.login` | AuthModal, AdminLayout |
| `/api/auth/register` | POST | `AuthContext.register` | AuthModal |
| `/api/auth/forgot-password` | POST | direct `apiFetch` | AuthModal |
| `/api/auth/reset-password` | POST | direct `apiFetch` | AuthModal |
| `/api/auth/profile` | PUT | `useUpdateProfile` | ProfilePage |
| `/api/contact` | POST | direct `apiFetch` | ContactPage |
| `/api/orders` | POST | `useCreateOrder` | CheckoutPage |
| `/api/reservations` | POST | `useCreateReservation` | ReservationPage, LocationsPage |
| `/api/addresses` | POST | `useAddAddress` | AddressesPage |
| `/api/addresses/:id` | PUT | `useUpdateAddress` | AddressesPage |
| `/api/addresses/:id` | DELETE | `useDeleteAddress` | AddressesPage |
| `/api/admin/upload/image` | POST (multipart) | `useUploadImage` | ImagePicker |
| `/api/admin/menu-items` | POST | `useCreateMenuItem` | MenuItemNewPage |
| `/api/admin/menu-items/:id` | PUT | `useUpdateMenuItem` | MenuItemEditPage |
| `/api/admin/menu-items/:id/prices` | PUT | `useUpdateMenuItemPrices` | MenuItemEditPage |
| `/api/admin/menu-items/:id` | DELETE | `useDeleteMenuItem` | AdminMenuIndex |
| `/api/admin/menus` | POST | `useCreateMenu` | MenuNewPage |
| `/api/admin/menus/:id` | PUT | `useUpdateMenu` | MenuEditPage |
| `/api/admin/menus/:id` | DELETE | `useDeleteMenu` | AdminMenusIndex |
| `/api/admin/menus/:id/toggle` | PATCH | `useToggleMenu` | AdminMenusIndex |
| `/api/admin/menus/:id/items` | POST | `useAddItemToMenu` | MenuEditPage |
| `/api/admin/menus/:id/items/:itemId` | DELETE | `useRemoveItemFromMenu` | MenuEditPage |
| `/api/admin/menus/:id/items/reorder` | PUT | `useReorderMenuItems` | MenuEditPage |
| `/api/admin/offers` | POST | `useCreateOffer` | OfferNewPage |
| `/api/admin/offers/:id` | PUT | `useUpdateOffer` | OfferEditPage |
| `/api/admin/offers/:id` | DELETE | `useDeleteOffer` | AdminOffersIndex |
| `/api/admin/offers/:id/toggle` | PATCH | `useToggleOffer` | AdminOffersIndex |
| `/api/admin/branches` | POST | `useCreateBranch` | BranchNewPage |
| `/api/admin/branches/:id` | PUT | `useUpdateBranch` | BranchEditPage |
| `/api/admin/orders/:id/status` | PATCH | `useUpdateOrderStatus` | AdminOrders |
| `/api/admin/reservations/:id/status` | PATCH | `useUpdateReservationStatus` | AdminReservations |

---

*End of report. Total files analysed: ~90 (all `.tsx`/`.ts` files under `src/` excluding shadcn UI primitives, `node_modules`, `dist`, and backend code).*
