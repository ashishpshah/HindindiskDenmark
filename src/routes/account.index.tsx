import { createFileRoute, Link } from "@tanstack/react-router";
import { ShoppingBag, CalendarCheck, Ticket, MapPin } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useMyOrders } from "@/hooks/useMyOrders";
import { useMyReservations } from "@/hooks/useMyReservations";
import { usePublicOffers } from "@/hooks/usePublicOffers";

export const Route = createFileRoute("/account/")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const { data: orders       = [] } = useMyOrders(!!user);
  const { data: reservations = [] } = useMyReservations(!!user);
  const { data: offers       = [] } = usePublicOffers();

  if (!user) return null;

  const cards = [
    { to: "/account/orders",       label: "My Orders",    icon: ShoppingBag,    value: orders.length },
    { to: "/account/reservations", label: "Reservations", icon: CalendarCheck,  value: reservations.length },
    { to: "/account/coupons",      label: "Coupons",      icon: Ticket,         value: offers.length },
    { to: "/account/addresses",    label: "Addresses",    icon: MapPin,         value: 1 },
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
                <div className="grid h-12 w-12 place-items-center rounded-2xl gradient-primary text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
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
