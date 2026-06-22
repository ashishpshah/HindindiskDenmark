import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShoppingBag, CalendarCheck, TrendingUp, Clock, Loader2, DollarSign,
  UtensilsCrossed, Tag, Users, GitBranch, ArrowRight,
} from "lucide-react";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function StatCard({ label, value, icon: Icon, sub, color = "primary" }:
  { label: string; value: string | number; icon: typeof ShoppingBag; sub?: string; color?: "primary" | "green" | "orange" | "blue" }) {
  const colors = {
    primary: "gradient-primary text-primary-foreground",
    green:   "bg-green-500 text-white",
    orange:  "bg-orange-500 text-white",
    blue:    "bg-blue-500 text-white",
  };
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="mt-1 font-display text-3xl font-bold">{value}</div>
          {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
        </div>
        <div className={`grid h-10 w-10 place-items-center rounded-xl ${colors[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

// F5 fixed: actual navigation cards replace static text
const QUICK_LINKS = [
  { label: "Orders",       to: "/admin/orders",       icon: ShoppingBag,     desc: "View & update order status"    },
  { label: "Reservations", to: "/admin/reservations", icon: CalendarCheck,   desc: "Manage table bookings"          },
  { label: "Menu Items",   to: "/admin/menu",         icon: UtensilsCrossed, desc: "Add & edit menu items"          },
  { label: "Menus",        to: "/admin/menus",        icon: GitBranch,       desc: "Organise menu categories"       },
  { label: "Offers",       to: "/admin/offers",       icon: Tag,             desc: "Coupons & promotions"           },
  { label: "Customers",    to: "/admin/customers",    icon: Users,           desc: "Browse registered customers"    },
];

function AdminDashboard() {
  const { data, isLoading } = useAdminDashboard();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Today's snapshot — auto-refreshes every 30 s
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading stats…
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard label="Orders Today"        value={data?.todayOrders ?? 0}                    icon={ShoppingBag}   color="primary" />
          <StatCard label="Revenue Today"       value={`${(data?.todayRevenue ?? 0).toFixed(0)} DKK`} icon={TrendingUp} color="green" />
          <StatCard label="Pending Orders"      value={data?.pendingOrders ?? 0}                  icon={Clock}         color="orange" sub="Placed / Accepted / Preparing" />
          <StatCard label="Reservations Today"  value={data?.todayReservations ?? 0}              icon={CalendarCheck} color="blue" />
          <StatCard label="All-Time Orders"     value={data?.totalOrders ?? 0}                    icon={ShoppingBag} />
          <StatCard label="All-Time Revenue"    value={`${(data?.totalRevenue ?? 0).toFixed(0)} DKK`} icon={DollarSign} color="green" />
        </div>
      )}

      <div>
        <h2 className="font-display text-lg font-semibold mb-3">Quick Links</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {QUICK_LINKS.map(({ label, to, icon: Icon, desc }) => (
            <Link
              key={to}
              to={to}
              className="group flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-soft transition hover:border-primary/40 hover:shadow-md"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{label}</div>
                <div className="truncate text-xs text-muted-foreground">{desc}</div>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
