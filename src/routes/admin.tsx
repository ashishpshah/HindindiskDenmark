import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import {
  LayoutDashboard, ShoppingBag, CalendarCheck, ExternalLink, LogOut, ChefHat, UtensilsCrossed, Ticket, Users,
} from "lucide-react";
import { useAuth, isAdminUser } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const NAV: Array<{ to: string; label: string; icon: typeof ShoppingBag; exact?: boolean }> = [
  { to: "/admin",              label: "Dashboard",     icon: LayoutDashboard,   exact: true },
  { to: "/admin/orders",       label: "Orders",        icon: ShoppingBag },
  { to: "/admin/reservations", label: "Reservations",  icon: CalendarCheck },
  { to: "/admin/menu",         label: "Menu Items",    icon: UtensilsCrossed },
  { to: "/admin/offers",       label: "Offers",        icon: Ticket },
  { to: "/admin/customers",    label: "Customers",     icon: Users },
];

function AdminLayout() {
  const { user, logout } = useAuth();

  if (!isAdminUser(user)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="max-w-sm text-center space-y-4">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-destructive/10 text-destructive">
            <ChefHat className="h-8 w-8" />
          </div>
          <h1 className="font-display text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground text-sm">
            You need an admin account to access this area.<br />
            Please log in with your admin credentials.
          </p>
          <Button asChild className="gradient-primary text-primary-foreground">
            <Link to="/">Back to Site</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r bg-card flex flex-col">
        <div className="flex items-center gap-2.5 border-b px-4 py-4">
          <div className="grid h-9 w-9 place-items-center rounded-xl gradient-primary text-primary-foreground">
            <ChefHat className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-sm font-bold leading-tight">Hind Indisk</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Admin</div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ to, label, icon: Icon, exact }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/70 transition hover:bg-accent hover:text-primary"
              activeProps={{ className: "bg-primary/10 text-primary" }}
              activeOptions={{ exact: exact ?? false }}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="border-t p-3 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/70 hover:bg-accent hover:text-primary transition"
          >
            <ExternalLink className="h-4 w-4" /> View Site
          </Link>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/70 hover:bg-accent hover:text-destructive transition"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
          <div className="px-3 py-1 text-xs text-muted-foreground truncate">{user?.email}</div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
