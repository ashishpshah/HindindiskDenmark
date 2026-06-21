import { createFileRoute } from "@tanstack/react-router";
import { ShoppingBag, CalendarCheck, TrendingUp, Clock, Loader2, DollarSign } from "lucide-react";
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
          <StatCard
            label="Orders Today"
            value={data?.todayOrders ?? 0}
            icon={ShoppingBag}
            color="primary"
          />
          <StatCard
            label="Revenue Today"
            value={`${(data?.todayRevenue ?? 0).toFixed(0)} DKK`}
            icon={TrendingUp}
            color="green"
          />
          <StatCard
            label="Pending Orders"
            value={data?.pendingOrders ?? 0}
            icon={Clock}
            sub="Placed / Accepted / Preparing"
            color="orange"
          />
          <StatCard
            label="Reservations Today"
            value={data?.todayReservations ?? 0}
            icon={CalendarCheck}
            color="blue"
          />
          <StatCard
            label="All-Time Orders"
            value={data?.totalOrders ?? 0}
            icon={ShoppingBag}
          />
          <StatCard
            label="All-Time Revenue"
            value={`${(data?.totalRevenue ?? 0).toFixed(0)} DKK`}
            icon={DollarSign}
            color="green"
          />
        </div>
      )}

      <div className="rounded-2xl border bg-card p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold mb-2">Quick Links</h2>
        <p className="text-sm text-muted-foreground">
          Use the sidebar to manage Orders, Reservations, Menu Items, Offers, and Customers.
        </p>
      </div>
    </div>
  );
}
