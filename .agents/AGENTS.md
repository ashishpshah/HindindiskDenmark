# Taste of Denmark / Hind Indisk Restaurant — Codebase Reference & Guidelines

Welcome to the project! This file serves as a reference manual and style guide for all agents and contributors working on the "Taste of Denmark" (Hind Indisk Restaurant) codebase.

---

## 1. Project Branding & Context
* **App Context:** A premium, luxury React frontend website for **Hind Indisk Restaurant** (an authentic Indian cuisine brand in Denmark).
* **Branches:** 
  1. **Aarhus:** Frederiksgade 72, 8000 Aarhus C
  2. **Copenhagen:** Vesterbrogade 41, 1620 København
* **Tone & Theme:** High-end, upscale, clean, and elegant culinary experience, combining rich Indian aesthetics (saffron amber, spices) with clean, minimalist Scandinavian design.

---

## 2. Technical Stack
* **Framework:** TanStack Start (full-stack framework built on TanStack Router)
* **Language:** TypeScript & React 19
* **Build Tool:** Vite
* **Styling:** Tailwind CSS v4 (`@tailwindcss/vite` plugin) + custom theme classes.
* **Component Library:** Radix UI primitives configured shadcn-style (`src/components/ui/`)
* **Icons:** `lucide-react`
* **Animations:** `framer-motion` and `tw-animate-css`
* **Data Fetching:** TanStack React Query

---

## 3. Styling & Theme Configurations (`src/styles.css`)
Tailwind CSS v4 is used with inline theme definitions inside `src/styles.css`.
* **Colors:**
  * **Primary Background:** Warm Alabaster / Soft Cream (`#FAF8F5` / `--background`)
  * **Primary Foreground (Text/Headings):** Midnight Forest Green (`#1C2E24` / `--foreground`)
  * **Primary CTA/Accent:** Saffron Amber (`#D9822B` / `--primary`)
  * **Secondary Background:** Deep Charcoal (`#1A1A1A` for dark premium sections)
* **Typography:**
  * **Headings (`h1`–`h6`):** `"Cormorant Garamond", Georgia, serif` (Midnight Forest Green, elegant contrast)
  * **Body Text:** `"Inter", sans-serif`
* **Gradients & Shadows:**
  * `--gradient-primary`: Orange saffron/amber gradient
  * `--gradient-dark`: Midnight forest green gradient
  * `--shadow-elegant`: Soft glow shadow for elegant card overlays
* **Tailwind Utilities:**
  * `glass`: Translucent white backdrop filter
  * `glass-dark`: Translucent black backdrop filter
  * `text-gradient`: Applies primary gradient to text headers
  * `shadow-glow`: Saffron glow shadow

---

## 4. Architecture & Routing (`src/routes/`)
File-based routing via TanStack Router.
* **Root Layout (`src/routes/__root.tsx`):**
  * Configures global contexts: `I18nProvider`, `AuthProvider`, `CartProvider`.
  * Injects Google Fonts, metadata, and JSON-LD structured schema for local SEO (Restaurant listing).
* **Main Routes:**
  * `/` (`index.tsx`): Home page featuring Hero carousel, Branches, Featured Menu items, Why Choose Us, Offers, and FAQ.
  * `/about` (`about.tsx`): Core story, timeline, statistics, and company values.
  * `/menu` (`menu.tsx`): Main menu interface with item categorizations (Starters, Mains, Breads, Desserts, Drinks), vegetarian/spiciness filters, and location-dependent cart additions.
  * `/menu/$name` (`menu.$name.tsx`): Detailed item detail page.
  * `/locations` (`locations.tsx`): Branches overview, contact info, and interactive visual map component (`dotted-map`).
  * `/reservation` (`reservation.tsx`): Booking engine with date picker, branch, guests, time, and reservation submission.
  * `/checkout` (`checkout.tsx`): Dual mode delivery/pickup ordering form with custom address input, coupon validations, and mock payment options.
  * `/order-tracking` (`order-tracking.tsx`): Simple order tracking display with progress steps.
  * `/account` (`account.tsx`): Nested router layout for profile details, addresses, order history, reservations, and discount coupons.

---

## 5. State Management & Data
* **Authentication (`src/context/AuthContext.tsx`):**
  * Provides simulated sign-in, registration, profile updating, and modal control.
  * User state is stored in localStorage key `hind-user`.
* **Cart & Pricing (`src/context/CartContext.tsx`):**
  * Local storage tracking of cart items (key: `hind-cart`), current order branch (key: `hind-branch`), and active coupons (key: `hind-coupon`).
  * **VAT/Tax:** Configured at 25% (standard Danish moms).
  * **Delivery Fee:** 39 DKK flat rate for deliveries.
  * **Coupons:** 
    * `WELCOME10` - 10% discount.
    * `FAMILY20` - 20% discount.
    * `FREEDELIVERY` - Waives the 39 DKK delivery charge.
* **Data Mock (`src/data/mock.ts`):** Contains mock data lists for team members, timeline milestones, reviews, faqs, branches, and all primary food dishes.

---

## 6. Development Best Practices
1. **Maintain Aesthetic Integrity:** Headings must always default to Cormorant Garamond (`font-display`) and body texts to Inter (`font-sans`).
2. **Preserve SEO Meta Tags:** All route files should declare semantic metadata (title, descriptions) in their route config options.
3. **Tailwind v4 Convention:** Avoid using `@apply` for complex utilities unless necessary. Prefer standard utility classes mapping to `--color-*` variables defined in theme config.
4. **Path Imports:** Import paths should map to absolute aliases defined in `tsconfig.json` (e.g. `@/components/*`, `@/context/*`, `@/data/*`).
