import { createFileRoute, Link, Outlet, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { LayoutDashboard, User, ShoppingBag, CalendarCheck, MapPin, Ticket, LogOut } from "lucide-react";
import { Layout } from "@/components/Layout";
import { PageHero } from "@/components/PageHero";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "My Account — Hind Indisk Restaurant" }] }),
  component: AccountLayout,
});

const links: { to: string; label: string; icon: typeof User; exact?: boolean }[] = [
  { to: "/account", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/account/profile", label: "Profile", icon: User },
  { to: "/account/orders", label: "My Orders", icon: ShoppingBag },
  { to: "/account/reservations", label: "My Reservations", icon: CalendarCheck },
  { to: "/account/addresses", label: "Saved Addresses", icon: MapPin },
  { to: "/account/coupons", label: "Coupons", icon: Ticket },
];

function AccountLayout() {
  const { user, openModal, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) openModal("login");
  }, [user, openModal]);

  if (!user) {
    return (
      <Layout>
        <PageHero eyebrow="Account" title="Please sign in" subtitle="Log in to access your account." image="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80" />
        <div className="mx-auto max-w-md px-6 py-16 text-center">
          <Button onClick={() => openModal("login")} className="gradient-primary text-primary-foreground">Sign in</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHero eyebrow="Account" title={`Hello, ${user.name}`} subtitle="Manage your profile, orders and reservations."
        image="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1920&q=80" />
      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-12 lg:grid-cols-[260px,1fr]">
        <aside className="h-fit rounded-3xl border bg-card p-4 shadow-soft">
          {links.map((l) => {
            const Icon = l.icon;
            return (
              <Link key={l.to} to={l.to as any} activeOptions={{ exact: !!l.exact }}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/80 transition hover:bg-accent hover:text-primary"
                activeProps={{ className: "bg-primary/10 text-primary" }}>
                <Icon className="h-4 w-4" /> {l.label}
              </Link>
            );
          })}
          <button onClick={() => { logout(); router.navigate({ to: "/" }); }}
            className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive transition hover:bg-destructive/10">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </aside>
        <div><Outlet /></div>
      </section>
    </Layout>
  );
}