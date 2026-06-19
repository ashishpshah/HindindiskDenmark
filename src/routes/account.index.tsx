import { createFileRoute, Link } from "@tanstack/react-router";
import { ShoppingBag, CalendarCheck, Ticket, MapPin } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/account/")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  if (!user) return null;
  const cards = [
    { to: "/account/orders", label: "My Orders", icon: ShoppingBag, value: getCount("hind-orders") },
    { to: "/account/reservations", label: "Reservations", icon: CalendarCheck, value: getCount("hind-reservations") },
    { to: "/account/coupons", label: "Coupons", icon: Ticket, value: 3 },
    { to: "/account/addresses", label: "Addresses", icon: MapPin, value: 1 },
  ];
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-card p-6 shadow-soft">
        <div className="font-display text-2xl font-semibold">Welcome back, {user.name}</div>
        <p className="mt-1 text-muted-foreground">Here's a snapshot of your activity at Hind Indisk.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.to} to={c.to as any} className="rounded-3xl border bg-card p-6 shadow-soft transition hover:shadow-elegant">
              <div className="flex items-center justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-2xl gradient-primary text-primary-foreground"><Icon className="h-5 w-5" /></div>
                <div className="font-display text-3xl font-bold">{c.value}</div>
              </div>
              <div className="mt-3 font-semibold">{c.label}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function getCount(key: string) {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(key) : null;
    return raw ? JSON.parse(raw).length : 0;
  } catch { return 0; }
}