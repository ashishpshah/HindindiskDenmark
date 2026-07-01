import { createFileRoute, Link, Outlet, useRouter, useRouterState, type LinkProps } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  LayoutDashboard, User, ShoppingBag, CalendarCheck,
  MapPin, Ticket, LogOut,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { PageHero } from "@/components/PageHero";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n/I18nProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "My Account — Hind Indisk Restaurant" }] }),
  component: AccountLayout,
});

// ── Nav item — reads router state to determine active ─────────────────────────
function NavItem({
  to, label, icon: Icon, exact = false,
}: { to: LinkProps["to"]; label: string; icon: React.ElementType; exact?: boolean }) {
  const { location } = useRouterState();
  const isActive = exact
    ? location.pathname === to
    : location.pathname.startsWith(to);

  return (
    <Link
      to={to}
      className={cn(
        "relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all select-none",
        isActive
          ? "bg-primary/10 text-primary font-semibold"
          : "text-foreground/70 hover:bg-accent hover:text-foreground",
      )}
    >
      {isActive && (
        <span className="absolute left-0 inset-y-2 w-[3px] rounded-r-full bg-primary" />
      )}
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}

// ── Mobile tab chip ────────────────────────────────────────────────────────────
function MobileTab({
  to, label, icon: Icon, exact = false,
}: { to: LinkProps["to"]; label: string; icon: React.ElementType; exact?: boolean }) {
  const { location } = useRouterState();
  const isActive = exact
    ? location.pathname === to
    : location.pathname.startsWith(to);

  return (
    <Link
      to={to}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-all",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-muted text-foreground/70 hover:bg-accent hover:text-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {label}
    </Link>
  );
}

// ── Layout ─────────────────────────────────────────────────────────────────────
function AccountLayout() {
  const { user, openModal, logout } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  const links = [
    { to: "/account",              label: t("account.dashboard"),      icon: LayoutDashboard, exact: true },
    { to: "/account/profile",      label: t("profile.title"),          icon: User },
    { to: "/account/orders",       label: t("account.myOrders"),       icon: ShoppingBag },
    { to: "/account/reservations", label: t("account.myReservations"), icon: CalendarCheck },
    { to: "/account/addresses",    label: t("account.savedAddresses"), icon: MapPin },
    { to: "/account/coupons",      label: t("account.coupons"),        icon: Ticket },
  ];

  useEffect(() => {
    if (!user) openModal("login");
  }, [user, openModal]);

  if (!user) {
    return (
      <Layout>
        <PageHero
          eyebrow="Account"
          title="Please sign in"
          subtitle="Log in to access your account."
          image="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80"
        />
        <div className="mx-auto max-w-md px-6 py-16 text-center">
          <Button onClick={() => openModal("login")} className="gradient-primary text-primary-foreground">
            Sign in
          </Button>
        </div>
      </Layout>
    );
  }

  const initials = user.name
    .split(" ")
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    logout();
    router.navigate({ to: "/" });
  };

  return (
    <Layout>
      <PageHero
        eyebrow="Account"
        title={`${t("account.welcome")}, ${user.name.split(" ")[0]}`}
        subtitle="Manage your profile, orders and reservations."
        image="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1920&q=80"
      />

      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-10">

        {/* ── Mobile horizontal tab bar (< lg) ─────────────────────────── */}
        <div className="lg:hidden mb-6">
          <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {links.map((l) => (
              <MobileTab key={l.to} to={l.to} label={l.label} icon={l.icon} exact={l.exact} />
            ))}
            <button
              onClick={handleLogout}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-3.5 py-1.5 text-xs font-medium text-destructive whitespace-nowrap transition hover:bg-destructive/10"
            >
              <LogOut className="h-3.5 w-3.5 shrink-0" />
              {t("actions.logout")}
            </button>
          </div>
        </div>

        {/* ── Desktop layout ────────────────────────────────────────────── */}
        <div className="lg:grid lg:grid-cols-[256px_1fr] lg:gap-8 lg:items-start">

          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 overflow-hidden rounded-3xl border bg-card shadow-soft">

              {/* Profile header */}
              <div className="flex items-center gap-3 border-b border-border/60 p-5">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full gradient-primary text-primary-foreground text-sm font-bold">
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{user.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{user.email}</div>
                </div>
              </div>

              {/* Nav links */}
              <nav className="space-y-0.5 p-3">
                {links.map((l) => (
                  <NavItem key={l.to} to={l.to} label={l.label} icon={l.icon} exact={l.exact} />
                ))}
              </nav>

              {/* Logout */}
              <div className="border-t border-border/60 p-3">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-destructive transition hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  {t("actions.logout")}
                </button>
              </div>
            </div>
          </aside>

          {/* Page content */}
          <main className="min-w-0">
            <Outlet />
          </main>

        </div>
      </section>
    </Layout>
  );
}
