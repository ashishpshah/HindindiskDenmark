import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShoppingBag, CalendarCheck, TrendingUp, Clock, Loader2, DollarSign,
  UtensilsCrossed, Users, GitBranch, ArrowRight, Store, Settings,
} from "lucide-react";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import { useBranches, type BranchDto } from "@/hooks/useBranches";
import { useAllClosures, type ClosureDto } from "@/hooks/useClosures";
import { todayInDenmark, nowInDenmark } from "@/lib/denmarkTime";
import { formatDateStr, formatTimeStr } from "@/lib/dateFormat";

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

const QUICK_LINKS = [
  { label: "Orders",       to: "/admin/orders",       icon: ShoppingBag,     desc: "View & update order status"    },
  { label: "Reservations", to: "/admin/reservations", icon: CalendarCheck,   desc: "Manage table bookings"          },
  { label: "Menu Items",   to: "/admin/menu",         icon: UtensilsCrossed, desc: "Add & edit menu items"          },
  { label: "Menus",        to: "/admin/menus",        icon: GitBranch,       desc: "Organise menu categories"       },
  { label: "Customers",    to: "/admin/customers",    icon: Users,           desc: "Browse registered customers"    },
];

// ── Branch closure status ────────────────────────────────────────────────────

type ServiceRow = {
  label:        string;
  isClosed:     boolean;
  note:         string | null;
  closureKind:  "Instant" | "Scheduled" | null;
  schedPeriod?: string;
};

function buildServiceRows(_branch: BranchDto, closures: ClosureDto[], today: string, nowStr: string): ServiceRow[] {
  // Instant = today-only DateRange closure currently active
  const activeInstant = (scope: "Reservation" | "Delivery" | "Pickup") =>
    closures.find(c => {
      if (c.scope !== scope || c.closureType !== "DateRange") return false;
      const s = c.startDate ?? "", e = c.endDate ?? s;
      if (s !== today || e !== today) return false;
      if (c.startTime && c.endTime) return nowStr >= c.startTime && nowStr <= c.endTime;
      return true;
    });

  // Scheduled = DateRange spanning today but not today-only
  const activeScheduled = (scope: "Reservation" | "Delivery" | "Pickup") =>
    closures.find(c => {
      if (c.scope !== scope || c.closureType !== "DateRange") return false;
      const s = c.startDate ?? "", e = c.endDate ?? s;
      if (today < s || today > e) return false;
      if (s === today && e === today) return false; // instant, handled above
      if (c.startTime && c.endTime) return nowStr >= c.startTime && nowStr <= c.endTime;
      return true;
    });

  const resInstant  = activeInstant("Reservation");
  const delInstant  = activeInstant("Delivery");
  const pickInstant = activeInstant("Pickup");
  const resSched    = activeScheduled("Reservation");
  const delSched    = activeScheduled("Delivery");
  const pickSched   = activeScheduled("Pickup");

  const schedPeriod = (c: ClosureDto) => {
    const period = c.startDate === c.endDate
      ? formatDateStr(c.startDate ?? "")
      : `${formatDateStr(c.startDate ?? "")} → ${formatDateStr(c.endDate ?? "")}`;
    const time = c.startTime && c.endTime
      ? ` (${formatTimeStr(c.startTime)}–${formatTimeStr(c.endTime)})`
      : "";
    return period + time;
  };

  return [
    {
      label:       "Reservation",
      isClosed:    !!resInstant || !!resSched,
      note:        resInstant?.note ?? resSched?.note ?? null,
      closureKind: resInstant ? "Instant" : resSched ? "Scheduled" : null,
      schedPeriod: resSched ? schedPeriod(resSched) : undefined,
    },
    {
      label:       "Order — Delivery",
      isClosed:    !!delInstant || !!delSched,
      note:        delInstant?.note ?? delSched?.note ?? null,
      closureKind: delInstant ? "Instant" : delSched ? "Scheduled" : null,
      schedPeriod: delSched ? schedPeriod(delSched) : undefined,
    },
    {
      label:       "Order — Pickup",
      isClosed:    !!pickInstant || !!pickSched,
      note:        pickInstant?.note ?? pickSched?.note ?? null,
      closureKind: pickInstant ? "Instant" : pickSched ? "Scheduled" : null,
      schedPeriod: pickSched ? schedPeriod(pickSched) : undefined,
    },
  ];
}

function BranchClosureCard({ branch, closures }: { branch: BranchDto; closures: ClosureDto[] }) {
  const today  = todayInDenmark();
  const nowStr = nowInDenmark().toTimeString().slice(0, 5);
  const rows   = buildServiceRows(branch, closures, today, nowStr);
  const anyClosed = rows.some(r => r.isClosed);

  return (
    <div className="rounded-2xl border bg-card shadow-soft overflow-hidden">
      {/* Header */}
      <div className={`flex items-center gap-2 px-4 py-3 border-b ${anyClosed ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"}`}>
        <Store className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="font-semibold text-sm flex-1 truncate">{branch.name}</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
          anyClosed ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
        }`}>
          {anyClosed ? "Partially closed" : "All open"}
        </span>
      </div>

      {/* Service rows */}
      <div className="divide-y">
        {rows.map(svc => (
          <div key={svc.label} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
            <span className="text-xs text-gray-500 w-36 shrink-0">{svc.label}</span>

            {svc.isClosed ? (
              <>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  Closed
                </span>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                  svc.closureKind === "Instant" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                }`}>
                  {svc.closureKind}
                </span>
                {svc.schedPeriod && (
                  <span className="text-xs text-gray-400">{svc.schedPeriod}</span>
                )}
                {svc.note && (
                  <span className="text-xs text-gray-500 italic truncate max-w-[160px]">{svc.note}</span>
                )}
              </>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Open
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
        <Link to="/admin/settings"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition">
          <Settings className="h-3.5 w-3.5" /> Manage
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading status…
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {branches.map(b => (
            <BranchClosureCard
              key={b.id}
              branch={b}
              closures={closures.filter(c => c.branchId === b.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

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
          <StatCard label="Orders Today"        value={data?.todayOrders ?? 0}                        icon={ShoppingBag}   color="primary" />
          <StatCard label="Revenue Today"       value={`${(data?.todayRevenue ?? 0).toFixed(0)} DKK`} icon={TrendingUp}    color="green"   />
          <StatCard label="Pending Orders"      value={data?.pendingOrders ?? 0}                      icon={Clock}         color="orange"  sub="Placed / Accepted / Preparing" />
          <StatCard label="Reservations Today"  value={data?.todayReservations ?? 0}                  icon={CalendarCheck} color="blue"    />
          <StatCard label="All-Time Orders"     value={data?.totalOrders ?? 0}                        icon={ShoppingBag}                  />
          <StatCard label="All-Time Revenue"    value={`${(data?.totalRevenue ?? 0).toFixed(0)} DKK`} icon={DollarSign}    color="green"   />
        </div>
      )}

      <BranchClosureStatus />

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
