import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShoppingBag, CalendarCheck, TrendingUp, Clock, Loader2, DollarSign,
  UtensilsCrossed, Users, GitBranch, ArrowRight, Store, Settings,
  ArrowUp, ArrowDown, AlertCircle, X,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { toast } from "sonner";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import { useAdminDashboardTrends } from "@/hooks/useAdminDashboardTrends";
import { useRevenueHistory } from "@/hooks/useRevenueHistory";
import { useTopItems } from "@/hooks/useTopItems";
import { useBranchOverview } from "@/hooks/useBranchOverview";
import { useHourlyVolume } from "@/hooks/useHourlyVolume";
import { useOrderCountsByStatus } from "@/hooks/useOrderCountsByStatus";
import { useAdminHub, type NewOrderEvent } from "@/hooks/useAdminHub";
import { useBranches, type BranchDto } from "@/hooks/useBranches";
import { useAllClosures, type ClosureDto } from "@/hooks/useClosures";
import { todayInDenmark, nowInDenmark } from "@/lib/denmarkTime";
import { formatDateStr, formatTimeStr } from "@/lib/dateFormat";
import { apiFetch } from "@/lib/api/client";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function StatCard({ label, value, icon: Icon, sub, color = "primary", trend }: {
  label: string; value: string | number; icon: typeof ShoppingBag;
  sub?: string; color?: "primary" | "green" | "orange" | "blue";
  trend?: { direction: "up" | "down"; pct: number } | null;
}) {
  const colors = {
    primary: "bg-primary text-primary-foreground",
    green:   "bg-green-500 text-white",
    orange:  "bg-orange-500 text-white",
    blue:    "bg-blue-500 text-white",
  };
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="mt-1 font-display text-3xl font-bold">{value}</div>
          <div className="flex items-center gap-2 mt-0.5">
            {trend && (
              <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                trend.direction === "up" ? "text-green-600" : "text-red-600"
              }`}>
                {trend.direction === "up" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {trend.pct.toFixed(0)}%
              </span>
            )}
            {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
          </div>
        </div>
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${colors[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function TrendArrow({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null;
  const pct = ((current - previous) / previous) * 100;
  return pct >= 0
    ? <span className="inline-flex items-center gap-0.5 text-xs font-medium text-green-600"><ArrowUp className="h-3 w-3" />{pct.toFixed(0)}%</span>
    : <span className="inline-flex items-center gap-0.5 text-xs font-medium text-red-600"><ArrowDown className="h-3 w-3" />{Math.abs(pct).toFixed(0)}%</span>;
}

const QUICK_LINKS = [
  { label: "Orders",       to: "/admin/orders",       icon: ShoppingBag,     desc: "View & update order status"    },
  { label: "Reservations", to: "/admin/reservations", icon: CalendarCheck,   desc: "Manage table bookings"          },
  { label: "Menu Items",   to: "/admin/menu",         icon: UtensilsCrossed, desc: "Add & edit menu items"          },
  { label: "Menus",        to: "/admin/menus",        icon: GitBranch,       desc: "Organise menu categories"       },
  { label: "Customers",    to: "/admin/customers",    icon: Users,           desc: "Browse registered customers"    },
];

// ── Branch closure status (unchanged) ──────────────────────────────────────

type ServiceRow = {
  label: string; isClosed: boolean; note: string | null;
  closureKind: "Instant" | "Scheduled" | null; schedPeriod?: string;
};

function buildServiceRows(branch: BranchDto, closures: ClosureDto[], today: string, nowStr: string): ServiceRow[] {
  const activeInstant = (scope: "Reservation" | "Delivery" | "Pickup") =>
    closures.find(c => {
      if (c.scope !== scope || c.closureType !== "DateRange") return false;
      const s = c.startDate ?? "", e = c.endDate ?? s;
      if (s !== today || e !== today) return false;
      if (c.startTime && c.endTime) return nowStr >= c.startTime && nowStr <= c.endTime;
      return true;
    });
  const activeScheduled = (scope: "Reservation" | "Delivery" | "Pickup") =>
    closures.find(c => {
      if (c.scope !== scope || c.closureType !== "DateRange") return false;
      const s = c.startDate ?? "", e = c.endDate ?? s;
      if (today < s || today > e) return false;
      if (s === today && e === today) return false;
      if (c.startTime && c.endTime) return nowStr >= c.startTime && nowStr <= c.endTime;
      return true;
    });
  const res = activeInstant("Reservation") ?? activeScheduled("Reservation");
  const del = activeInstant("Delivery") ?? activeScheduled("Delivery");
  const pick = activeInstant("Pickup") ?? activeScheduled("Pickup");
  const schedPeriod = (c: ClosureDto) => {
    const period = c.startDate === c.endDate
      ? formatDateStr(c.startDate ?? "")
      : `${formatDateStr(c.startDate ?? "")} \u2192 ${formatDateStr(c.endDate ?? "")}`;
    const time = c.startTime && c.endTime ? ` (${formatTimeStr(c.startTime)}\u2013${formatTimeStr(c.endTime)})` : "";
    return period + time;
  };
  return [
    { label: "Reservation",      isClosed: !!res, note: res?.note ?? null, closureKind: res ? (activeInstant("Reservation") ? "Instant" : "Scheduled") : null, schedPeriod: res && !activeInstant("Reservation") ? schedPeriod(res) : undefined },
    { label: `Order \u2014 Delivery`, isClosed: !!del, note: del?.note ?? null, closureKind: del ? (activeInstant("Delivery") ? "Instant" : "Scheduled") : null,  schedPeriod: del && !activeInstant("Delivery") ? schedPeriod(del) : undefined },
    { label: `Order \u2014 Pickup`,   isClosed: !!pick, note: pick?.note ?? null, closureKind: pick ? (activeInstant("Pickup") ? "Instant" : "Scheduled") : null,  schedPeriod: pick && !activeInstant("Pickup") ? schedPeriod(pick) : undefined },
  ];
}

function BranchClosureCard({ branch, closures }: { branch: BranchDto; closures: ClosureDto[] }) {
  const today = todayInDenmark();
  const nowStr = nowInDenmark().toTimeString().slice(0, 5);
  const rows = buildServiceRows(branch, closures, today, nowStr);
  const anyClosed = rows.some(r => r.isClosed);
  return (
    <div className="rounded-2xl border bg-card shadow-soft overflow-hidden">
      <div className={`flex items-center gap-2 px-4 py-3 border-b ${anyClosed ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"}`}>
        <Store className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="font-semibold text-sm flex-1 truncate">{branch.name}</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${anyClosed ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
          {anyClosed ? "Partially closed" : "All open"}
        </span>
      </div>
      <div className="divide-y">
        {rows.map(svc => (
          <div key={svc.label} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
            <span className="text-xs text-gray-500 w-36 shrink-0">{svc.label}</span>
            {svc.isClosed ? (
              <>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Closed
                </span>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${svc.closureKind === "Instant" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>{svc.closureKind}</span>
                {svc.schedPeriod && <span className="text-xs text-gray-400">{svc.schedPeriod}</span>}
                {svc.note && <span className="text-xs text-gray-500 italic truncate max-w-[160px]">{svc.note}</span>}
              </>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Open
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function BranchClosureStatus() {
  const { data: branches = [], isLoading: isBranchLoading } = useBranches();
  const branchIds = branches.map(b => b.id);
  const { data: closures, isLoading: isClosureLoading } = useAllClosures(branchIds);
  const isLoading = isBranchLoading || isClosureLoading;
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg font-semibold">Current Service Status</h2>
        <Link to="/admin/settings" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition">
          <Settings className="h-3.5 w-3.5" /> Manage
        </Link>
      </div>
      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Loading status…</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {branches.map(b => <BranchClosureCard key={b.id} branch={b} closures={closures.filter(c => c.branchId === b.id)} />)}
        </div>
      )}
    </div>
  );
}

// ── Widgets ──────────────────────────────────────────────────────────────

function StatusBreakdown() {
  const { data, isLoading } = useOrderCountsByStatus();
  if (isLoading || !data) return null;
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft">
      <h3 className="font-semibold text-sm mb-3">Order Status Breakdown</h3>
      <div className="flex flex-wrap gap-2">
        {data.map(s => (
          <span key={s.statusName} className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {s.statusName}
            <span className="inline-flex items-center justify-center rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold">{s.count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function RevenueChart() {
  const { data, isLoading } = useRevenueHistory(7);
  if (isLoading || !data) return <div className="rounded-2xl border bg-card p-5 shadow-soft"><Loader2 className="h-4 w-4 animate-spin" /></div>;
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft">
      <h3 className="font-semibold text-sm mb-3">Revenue (7 days)</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
              formatter={(v: number) => [`${v.toFixed(0)} DKK`, "Revenue"]}
              labelFormatter={d => formatDateStr(d)}
            />
            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TopItemsWidget() {
  const { data, isLoading } = useTopItems(7);
  if (isLoading || !data) return <div className="rounded-2xl border bg-card p-5 shadow-soft"><Loader2 className="h-4 w-4 animate-spin" /></div>;
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft">
      <h3 className="font-semibold text-sm mb-3">Top-Selling Items (7 days)</h3>
      <div className="space-y-2">
        {data.map((item, i) => (
          <div key={item.name} className="flex items-center gap-3 text-xs">
            <span className="w-5 text-center font-mono text-muted-foreground">{i + 1}</span>
            <span className="flex-1 truncate">{item.name}</span>
            <span className="font-mono font-medium">{item.quantity}x</span>
            <span className="font-mono text-muted-foreground w-16 text-right">{item.revenue.toFixed(0)} DKK</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HourlyVolumeChart() {
  const { data, isLoading } = useHourlyVolume();
  const chartData = useMemo(() => {
    if (!data) return [];
    const buckets: { hour: string; count: number }[] = [];
    for (let h = 0; h < 24; h++) {
      const found = data.find(d => d.hour === h);
      buckets.push({ hour: `${h.toString().padStart(2, "0")}:00`, count: found?.count ?? 0 });
    }
    return buckets;
  }, [data]);
  if (isLoading) return <div className="rounded-2xl border bg-card p-5 shadow-soft"><Loader2 className="h-4 w-4 animate-spin" /></div>;
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft">
      <h3 className="font-semibold text-sm mb-3">Order Volume by Hour (Today)</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={2} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
              formatter={(v: number) => [v, "Orders"]}
            />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function BranchOverviewWidget() {
  const { data, isLoading } = useBranchOverview();
  if (isLoading || !data) return null;
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft">
      <h3 className="font-semibold text-sm mb-3">Branch Overview (Today)</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {data.map(b => (
          <div key={b.branchName} className="flex items-center justify-between rounded-xl border p-3">
            <div>
              <div className="text-sm font-medium">{b.branchName}</div>
              <div className="text-xs text-muted-foreground">{b.todayOrders} orders</div>
            </div>
            <div className="text-sm font-mono font-semibold">{b.todayRevenue.toFixed(0)} DKK</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentOrdersWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-recent-orders"],
    queryFn: () => apiFetch<{ items: { id: number; customerName: string; status: string; total: number; createdAt: string }[] }>(
      "/api/admin/orders?page=1&pageSize=5"
    ),
    refetchInterval: 15_000,
  });
  if (isLoading || !data) return <div className="rounded-2xl border bg-card p-5 shadow-soft"><Loader2 className="h-4 w-4 animate-spin" /></div>;
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Recent Orders</h3>
        <Link to="/admin/orders" className="text-xs text-muted-foreground hover:text-primary transition">View all</Link>
      </div>
      <div className="space-y-2">
        {data.items.map(o => (
          <Link key={o.id} to="/admin/orders" className="flex items-center justify-between rounded-lg border p-2.5 text-xs transition hover:bg-muted/50">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono font-medium shrink-0">#{o.id}</span>
              <span className="truncate">{o.customerName}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">{o.status}</span>
              <span className="font-mono text-muted-foreground">{o.total.toFixed(0)} DKK</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function NewOrderToast({ event }: { event: NewOrderEvent }) {
  return (
    <div className="flex items-center gap-3">
      <AlertCircle className="h-5 w-5 text-primary shrink-0" />
      <div>
        <div className="font-medium text-sm">New Order #{event.id}</div>
        <div className="text-xs text-muted-foreground">{event.contactName} • {event.total.toFixed(0)} DKK</div>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────

function AdminDashboard() {
  const { data: dashData, isLoading: dashLoading } = useAdminDashboard();
  const { data: trends } = useAdminDashboardTrends();
  const [newOrders, setNewOrders] = useState<NewOrderEvent[]>([]);

  useAdminHub((ev) => {
    setNewOrders(prev => [{ ...ev, status: "New" }, ...prev].slice(0, 20));
    toast.custom(t => (
      <div className="flex items-center gap-2 rounded-xl border bg-card p-3 shadow-lg">
        <AlertCircle className="h-5 w-5 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">New Order #{ev.id}</div>
          <div className="text-xs text-muted-foreground truncate">{ev.contactName} • {ev.total.toFixed(0)} DKK</div>
        </div>
        <button onClick={() => toast.dismiss(t)} className="shrink-0 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>
    ));
  });

  const recentAlerts = useMemo(() => newOrders.slice(0, 5), [newOrders]);

  const trend = (current: number, yesterday: number | undefined) => {
    if (yesterday === undefined || yesterday === 0) return null;
    const pct = ((current - yesterday) / yesterday) * 100;
    return { direction: (pct >= 0 ? "up" : "down") as "up" | "down", pct: Math.abs(pct) };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Today's snapshot — auto-refreshes every 30 s</p>
        </div>
        {recentAlerts.length > 0 && (
          <div className="flex gap-2">
            {recentAlerts.map(o => (
              <div key={o.id} className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary animate-in slide-in-from-right">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                New #{o.id}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stat cards */}
      {dashLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading stats…</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard label="Orders Today"  value={dashData?.todayOrders ?? 0} icon={ShoppingBag} color="primary"
            trend={trend(dashData?.todayOrders ?? 0, trends?.yesterdayOrders)} />
          <StatCard label="Revenue Today" value={`${(dashData?.todayRevenue ?? 0).toFixed(0)} DKK`} icon={TrendingUp} color="green"
            trend={trend(dashData?.todayRevenue ?? 0, trends?.yesterdayRevenue)} />
          <StatCard label="Pending Orders" value={dashData?.pendingOrders ?? 0} icon={Clock} color="orange" sub="Non-terminal statuses" />
          <StatCard label="Reservations Today" value={dashData?.todayReservations ?? 0} icon={CalendarCheck} color="blue"
            trend={trend(dashData?.todayReservations ?? 0, trends?.yesterdayReservations)} />
          <StatCard label="All-Time Orders" value={dashData?.totalOrders ?? 0} icon={ShoppingBag} />
          <StatCard label="All-Time Revenue" value={`${(dashData?.totalRevenue ?? 0).toFixed(0)} DKK`} icon={DollarSign} color="green" />
        </div>
      )}

      {/* Status breakdown */}
      <StatusBreakdown />

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueChart />
        <HourlyVolumeChart />
      </div>

      {/* Top items + Branch overview row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TopItemsWidget />
        <BranchOverviewWidget />
      </div>

      {/* Recent orders */}
      <RecentOrdersWidget />

      {/* Branch closures (existing) */}
      <BranchClosureStatus />

      {/* Quick Links (existing) */}
      <div>
        <h2 className="font-display text-lg font-semibold mb-3">Quick Links</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {QUICK_LINKS.map(({ label, to, icon: Icon, desc }) => (
            <Link key={to} to={to}
              className="group flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-soft transition hover:border-primary/40 hover:shadow-md">
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
