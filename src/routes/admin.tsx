import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard, ShoppingBag, CalendarCheck, ExternalLink, LogOut, ChefHat,
  UtensilsCrossed, Ticket, Users, Eye, EyeOff, Loader2, BookOpen, Store, Menu, X,
} from "lucide-react";
import { useAuth, isAdminUser } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const NAV: Array<{ to: string; label: string; icon: typeof ShoppingBag; exact?: boolean }> = [
  { to: "/admin",              label: "Dashboard",     icon: LayoutDashboard,   exact: true },
  { to: "/admin/orders",       label: "Orders",        icon: ShoppingBag },
  { to: "/admin/reservations", label: "Reservations",  icon: CalendarCheck },
  { to: "/admin/menus",        label: "Menus",         icon: BookOpen },
  { to: "/admin/menu",         label: "Items",         icon: UtensilsCrossed },
  { to: "/admin/offers",       label: "Offers",        icon: Ticket },
  { to: "/admin/branches",     label: "Branches",      icon: Store },
  { to: "/admin/customers",    label: "Customers",     icon: Users },
];

function AdminLoginForm() {
  const { login } = useAuth();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError((err as Error).message ?? "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-3">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl gradient-primary text-primary-foreground shadow-md">
            <ChefHat className="h-8 w-8" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Admin Login</h1>
            <p className="text-sm text-muted-foreground mt-1">Hind Indisk — Staff Portal</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-3xl border bg-card p-8 shadow-soft space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="admin-email">Email</Label>
            <Input id="admin-email" type="email" required autoFocus placeholder="admin@hindindisk.dk"
              value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="admin-password">Password</Label>
            <div className="relative">
              <Input id="admin-password" type={showPwd ? "text" : "password"} required placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10" />
              <button type="button" onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition">
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-destructive/10 px-4 py-2.5 text-sm text-destructive text-center">{error}</p>
          )}

          <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…</> : "Sign In"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary transition">← Back to site</Link>
        </p>
      </div>
    </div>
  );
}

// Shared sidebar nav content — used in both desktop aside and mobile drawer
function SidebarNav({ onNavClick }: { onNavClick?: () => void }) {
  const { user, logout } = useAuth();
  return (
    <>
      <div className="flex items-center gap-2.5 border-b px-4 py-4">
        <div className="grid h-9 w-9 place-items-center rounded-xl gradient-primary text-primary-foreground">
          <ChefHat className="h-5 w-5" />
        </div>
        <div>
          <div className="font-display text-sm font-bold leading-tight">Hind Indisk</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Admin</div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon, exact }) => (
          <Link
            key={to}
            to={to}
            onClick={onNavClick}
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
        <Link to="/" onClick={onNavClick}
          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/70 hover:bg-accent hover:text-primary transition">
          <ExternalLink className="h-4 w-4" /> View Site
        </Link>
        <button onClick={logout}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/70 hover:bg-accent hover:text-destructive transition">
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
        <div className="px-3 py-1 text-xs text-muted-foreground truncate">{user?.email}</div>
      </div>
    </>
  );
}

function AdminLayout() {
  const { user } = useAuth();
  // F6 fixed: mobile drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (!user) return <AdminLoginForm />;

  if (!isAdminUser(user)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="max-w-sm text-center space-y-4">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-destructive/10 text-destructive">
            <ChefHat className="h-8 w-8" />
          </div>
          <h1 className="font-display text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground text-sm">Your account does not have admin privileges.</p>
          <Button asChild className="gradient-primary text-primary-foreground">
            <Link to="/">Back to Site</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Desktop sidebar — hidden on small screens */}
      <aside className="hidden md:flex w-56 shrink-0 border-r bg-card flex-col">
        <SidebarNav />
      </aside>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile drawer panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-card shadow-xl transition-transform duration-300 md:hidden
          ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <button
          onClick={() => setDrawerOpen(false)}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
        <SidebarNav onNavClick={() => setDrawerOpen(false)} />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Mobile top bar with hamburger */}
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b bg-card/80 backdrop-blur px-4 py-3 md:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg gradient-primary text-primary-foreground">
              <ChefHat className="h-4 w-4" />
            </div>
            <span className="font-display text-sm font-bold">Hind Indisk Admin</span>
          </div>
        </div>

        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
