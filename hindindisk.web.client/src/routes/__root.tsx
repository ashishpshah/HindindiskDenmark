import { Outlet, Link, createRootRouteWithContext, useRouter, useRouterState } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "../components/ui/sonner";
import { I18nProvider } from "@/i18n/I18nProvider";
import { AuthProvider } from "@/context/AuthContext";
import { AdminAuthProvider } from "@/context/AdminAuthContext";
import { CartProvider } from "@/context/CartContext";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  if (import.meta.env.DEV) console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

// Fires hind:enter-admin / hind:enter-client whenever the route zone changes,
// so the opposite auth context can clear its session automatically.
function ZoneGuard() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const prevZone = useRef<"admin" | "client" | null>(null);

  useEffect(() => {
    const zone: "admin" | "client" = pathname.startsWith("/admin") ? "admin" : "client";
    if (prevZone.current !== null && prevZone.current !== zone) {
      window.dispatchEvent(new Event(
        zone === "admin" ? "hind:enter-admin" : "hind:enter-client"
      ));
    }
    prevZone.current = zone;
  }, [pathname]);

  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthProvider>
          <AdminAuthProvider>
            <CartProvider>
              <ZoneGuard />
              <Outlet />
              <Toaster position="top-right" richColors />
            </CartProvider>
          </AdminAuthProvider>
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
