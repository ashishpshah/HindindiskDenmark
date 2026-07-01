# Plan: Migrate Frontend src/ from taste-of-denmark into HindIndisk.Web client

## Context
The source project (`taste-of-denmark-main`) is a full-featured restaurant SPA built with TanStack Start (SSR framework), TanStack Router, Tailwind CSS, Radix UI, and ~50 additional packages. The destination (`hindindisk.web.client`) is a bare Vite + React scaffold with only `react` and `react-dom` installed.

The goal is to replace the destination's placeholder `src/` with the real application code while keeping `.esproj`, `package.json` metadata (name/version), and existing library versions unchanged. New packages must be added since the source code requires them.

**Critical adapter work:** The source uses TanStack Start SSR APIs (`shellComponent`, `head()`, `HeadContent`, `Scripts`) that don't exist in a plain SPA. These must be stripped from `__root.tsx` and replaced with a standard SPA entry point.

---

## Steps

### 1 — Copy src/ files
Copy everything from:
`D:\VK\Projects\Personal\AI\PracticalApps\taste-of-denmark-main\src\`
→ `D:\VK\Projects\Personal\AI\PracticalApps\HindIndisk.Web\hindindisk.web.client\src\`

Overwrite the existing `src/` entirely.

### 2 — Delete TanStack Start server-only files
Remove from the copied src/:
- `src/start.ts` — TanStack Start server bootstrap, not needed in ASP.NET SPA
- `src/server.ts` — Nitro/h3 server handler, not needed in ASP.NET SPA

### 3 — Create src/main.tsx (SPA entry point)
The destination's `index.html` uses `/src/main.tsx` as its entry. Create it:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { getRouter } from './router'
import './styles.css'

const router = getRouter()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
```

### 4 — Adapt src/routes/__root.tsx (strip SSR APIs)
Remove TanStack Start-specific imports and props that only work server-side:
- Remove imports: `HeadContent`, `Scripts` from `@tanstack/react-router`; `appCss ?url` import; `faviconUrl` import
- Remove `head()` function (meta/links/scripts moved to `index.html`)
- Remove `shellComponent: RootShell` prop and the `RootShell` function
- Keep `component`, `notFoundComponent`, `errorComponent`, `NotFoundComponent`, `ErrorComponent`, `RootComponent` unchanged

Resulting route definition:
```tsx
export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});
```

### 5 — Update index.html
Add Google Fonts and fix favicon (was injected via TanStack Start SSR; now must live in HTML):
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/main_logo-removebg-preview.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Hind Indisk</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Also copy the logo PNG to `public/`:
`src/assets/main_logo-removebg-preview.png` → `public/main_logo-removebg-preview.png`

### 6 — Update vite.config.ts
Add TanStack Router plugin (auto-generates routeTree.gen.ts), Tailwind CSS, and tsconfig-paths:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    TanStackRouterVite({ routesDirectory: './src/routes', generatedRouteTree: './src/routeTree.gen.ts' }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  base: '/',
  build: { outDir: 'dist' },
})
```

### 7 — Update tsconfig.app.json
Add the `@/*` path alias used throughout the source code:
```json
"paths": {
  "@/*": ["./src/*"]
}
```

### 8 — Add missing packages to package.json
Add these to `dependencies` (skip `@tanstack/react-start`, `nitro`, `@lovable.dev/vite-tanstack-config` — all server-side only):

```
@hookform/resolvers, @radix-ui/react-accordion, @radix-ui/react-alert-dialog,
@radix-ui/react-aspect-ratio, @radix-ui/react-avatar, @radix-ui/react-checkbox,
@radix-ui/react-collapsible, @radix-ui/react-context-menu, @radix-ui/react-dialog,
@radix-ui/react-dropdown-menu, @radix-ui/react-hover-card, @radix-ui/react-label,
@radix-ui/react-menubar, @radix-ui/react-navigation-menu, @radix-ui/react-popover,
@radix-ui/react-progress, @radix-ui/react-radio-group, @radix-ui/react-scroll-area,
@radix-ui/react-select, @radix-ui/react-separator, @radix-ui/react-slider,
@radix-ui/react-slot, @radix-ui/react-switch, @radix-ui/react-tabs,
@radix-ui/react-toggle, @radix-ui/react-toggle-group, @radix-ui/react-tooltip,
@tailwindcss/vite, @tanstack/react-query, @tanstack/react-router,
@tanstack/react-table, @tanstack/router-plugin, class-variance-authority,
clsx, cmdk, date-fns, dotted-map, embla-carousel-react, framer-motion,
input-otp, lucide-react, react-day-picker, react-hook-form,
react-resizable-panels, recharts, sonner, tailwind-merge, tailwindcss,
tw-animate-css, vaul, vite-tsconfig-paths, zod
```

Keep existing `react` and `react-dom` at their current versions.

### 9 — Run npm install
```
npm install
```
in `hindindisk.web.client/`

### 10 — Verify build
```
npm run build
```
Confirm `dist/` is produced with no errors, then run `dotnet publish` to confirm ASP.NET integration still works.

---

## Files modified
| File | Change |
|------|--------|
| `hindindisk.web.client/src/` | Replaced entirely with source project's src/ |
| `hindindisk.web.client/src/main.tsx` | Created (new SPA entry point) |
| `hindindisk.web.client/src/routes/__root.tsx` | SSR APIs stripped |
| `hindindisk.web.client/src/start.ts` | Deleted |
| `hindindisk.web.client/src/server.ts` | Deleted |
| `hindindisk.web.client/index.html` | Fonts + favicon added |
| `hindindisk.web.client/public/` | Logo PNG copied here |
| `hindindisk.web.client/vite.config.ts` | TanStack Router + Tailwind + tsconfig-paths added |
| `hindindisk.web.client/tsconfig.app.json` | `@/*` path alias added |
| `hindindisk.web.client/package.json` | ~50 new packages added |

## Not changed
- `.esproj` project file
- `package.json` name, version, or existing library versions
- `tsconfig.json` (root references file)
- `tsconfig.node.json`
