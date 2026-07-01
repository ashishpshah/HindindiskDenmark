import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Loader2, Search, History, ChevronDown, ChevronRight,
  ShoppingBag, CalendarCheck2,
} from "lucide-react";
import {
  useAdminCustomers, useAdminCustomerDetail,
  type AdminCustomerDto, type AdminCustomerOrderDto, type AdminCustomerReservationDto,
} from "@/hooks/useAdminCustomers";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { nowInDenmark } from "@/lib/denmarkTime";

export const Route = createFileRoute("/admin/customers")({ component: AdminCustomers });

// ── Status colours ──────────────────────────────────────────────────────────

const ORDER_STATUS_COLORS: Record<string, string> = {
  Completed: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
  Preparing: "bg-amber-100 text-amber-700",
  Placed:    "bg-blue-100 text-blue-700",
};

const RES_STATUS_COLORS: Record<string, string> = {
  Confirmed: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
};

// ── Date filter ─────────────────────────────────────────────────────────────

type DatePreset = "all" | "today" | "yesterday" | "this-week" | "last-week" | "this-month" | "last-month" | "custom";

const PRESETS: { label: string; value: DatePreset }[] = [
  { label: "All",        value: "all" },
  { label: "Today",      value: "today" },
  { label: "Yesterday",  value: "yesterday" },
  { label: "This Week",  value: "this-week" },
  { label: "Last Week",  value: "last-week" },
  { label: "This Month", value: "this-month" },
  { label: "Last Month", value: "last-month" },
  { label: "Custom",     value: "custom" },
];

function getRange(preset: DatePreset, customFrom: string, customTo: string): [Date | null, Date | null] {
  const now   = nowInDenmark();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eod   = (d: Date) => new Date(d.getTime() + 86399999);

  switch (preset) {
    case "today":     return [today, eod(today)];
    case "yesterday": {
      const y = new Date(today.getTime() - 86400000);
      return [y, eod(y)];
    }
    case "this-week": {
      const dow = today.getDay();
      const mon = new Date(today.getTime() - (dow === 0 ? 6 : dow - 1) * 86400000);
      return [mon, eod(new Date(mon.getTime() + 6 * 86400000))];
    }
    case "last-week": {
      const dow     = today.getDay();
      const thisMon = new Date(today.getTime() - (dow === 0 ? 6 : dow - 1) * 86400000);
      const lastMon = new Date(thisMon.getTime() - 7 * 86400000);
      return [lastMon, eod(new Date(lastMon.getTime() + 6 * 86400000))];
    }
    case "this-month": {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      const to   = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return [from, eod(to)];
    }
    case "last-month": {
      const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const to   = new Date(today.getFullYear(), today.getMonth(), 0);
      return [from, eod(to)];
    }
    case "custom":
      return [
        customFrom ? new Date(customFrom) : null,
        customTo   ? new Date(customTo + "T23:59:59.999") : null,
      ];
    default:
      return [null, null];
  }
}

function inRange(dateStr: string, from: Date | null, to: Date | null): boolean {
  if (!from && !to) return true;
  const d = new Date(dateStr);
  if (from && d < from) return false;
  if (to   && d > to)   return false;
  return true;
}

// ── Order card (expandable items) ───────────────────────────────────────────

function OrderCard({ order }: { order: AdminCustomerOrderDto }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border bg-card text-sm">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition rounded-lg gap-2"
      >
        <div className="flex items-center gap-3 min-w-0 flex-wrap">
          <span className="font-mono text-xs text-muted-foreground shrink-0">#{order.id}</span>
          <span className="text-muted-foreground shrink-0">{order.branchName.replace("Hind Indisk ", "")}</span>
          <span className="text-muted-foreground shrink-0">{order.orderType}</span>
          <span className="text-xs text-muted-foreground shrink-0">
            {order.itemCount} item{order.itemCount !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ORDER_STATUS_COLORS[order.status] ?? "bg-blue-100 text-blue-700"}`}>
            {order.status}
          </span>
          <span className="font-semibold tabular-nums">{order.total.toFixed(0)} DKK</span>
          <span className="text-xs text-muted-foreground">
            {new Date(order.createdAt).toLocaleDateString("da-DK", { timeZone: "Europe/Copenhagen", day: "2-digit", month: "short", year: "numeric" })}
          </span>
          {expanded
            ? <ChevronDown  className="h-3.5 w-3.5 text-muted-foreground" />
            : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
      </button>

      {expanded && order.items.length > 0 && (
        <div className="px-4 pb-3 border-t">
          <table className="w-full mt-2 text-xs">
            <tbody>
              {order.items.map((item, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-1.5 text-muted-foreground">{item.name}</td>
                  <td className="py-1.5 text-center text-muted-foreground">×{item.quantity}</td>
                  <td className="py-1.5 text-right font-medium tabular-nums">
                    {(item.priceAtPurchase * item.quantity).toFixed(0)} DKK
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Reservation card ────────────────────────────────────────────────────────

function ReservationCard({ r }: { r: AdminCustomerReservationDto }) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3 flex items-start justify-between text-sm gap-4">
      <div className="flex items-start gap-3 min-w-0">
        <span className="font-mono text-xs text-muted-foreground shrink-0 mt-0.5">#{r.id}</span>
        <div className="min-w-0">
          <div className="font-medium">{r.branchName.replace("Hind Indisk ", "")}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {r.date} · {r.timeSlot} · {r.guestCount} guest{r.guestCount !== 1 ? "s" : ""}
          </div>
          {r.specialRequests && (
            <div className="text-xs text-muted-foreground italic mt-0.5 truncate">"{r.specialRequests}"</div>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${RES_STATUS_COLORS[r.status] ?? "bg-gray-100 text-gray-700"}`}>
          {r.status}
        </span>
        <span className="text-xs text-muted-foreground">
          {new Date(r.createdAt).toLocaleDateString("da-DK", { timeZone: "Europe/Copenhagen", day: "2-digit", month: "short", year: "numeric" })}
        </span>
      </div>
    </div>
  );
}

// ── History dialog ──────────────────────────────────────────────────────────

function CustomerHistoryDialog({
  customer,
  onClose,
}: {
  customer: AdminCustomerDto | null;
  onClose: () => void;
}) {
  const [preset,     setPreset]     = useState<DatePreset>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo,   setCustomTo]   = useState("");

  const { data: detail, isLoading } = useAdminCustomerDetail(customer?.id ?? null);

  const [from, to] = getRange(preset, customFrom, customTo);

  const filteredOrders = (detail?.orders       ?? []).filter(o => inRange(o.createdAt, from, to));
  const filteredRes    = (detail?.reservations ?? []).filter(r => inRange(r.createdAt, from, to));

  const filteredSpend = filteredOrders
    .filter(o => o.status !== "Cancelled")
    .reduce((s, o) => s + o.total, 0);

  return (
    <Dialog open={customer !== null} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden gap-0">

        {/* Customer header */}
        <DialogHeader className="shrink-0 pb-4 border-b">
          <DialogTitle className="font-display text-2xl leading-tight">{customer?.name}</DialogTitle>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm mt-1">
            {customer?.email && <span className="text-muted-foreground">{customer.email}</span>}
            {customer?.phone && <span className="text-muted-foreground">{customer.phone}</span>}
            <span className="font-medium">
              {customer?.orderCount ?? 0} orders · {customer?.reservationCount ?? 0} reservations · {(customer?.totalSpend ?? 0).toFixed(0)} DKK total
            </span>
          </div>
        </DialogHeader>

        {/* Date filter */}
        <div className="shrink-0 py-3 border-b space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map(p => (
              <button
                key={p.value}
                onClick={() => setPreset(p.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  preset === p.value
                    ? "gradient-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {preset === "custom" && (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                className="h-8 w-36 text-xs"
              />
              <span className="text-muted-foreground text-xs">to</span>
              <Input
                type="date"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                className="h-8 w-36 text-xs"
              />
            </div>
          )}
        </div>

        {/* Body */}
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground py-12">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading history…
          </div>
        ) : (
          <Tabs defaultValue="orders" className="flex flex-col flex-1 min-h-0 overflow-hidden pt-3">
            <TabsList className="shrink-0 self-start mb-3">
              <TabsTrigger value="orders" className="gap-1.5">
                <ShoppingBag className="h-3.5 w-3.5" />
                Orders ({filteredOrders.length})
              </TabsTrigger>
              <TabsTrigger value="reservations" className="gap-1.5">
                <CalendarCheck2 className="h-3.5 w-3.5" />
                Reservations ({filteredRes.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="flex-1 overflow-y-auto space-y-2 pr-1 mt-0">
              {filteredOrders.length === 0
                ? <p className="text-sm text-muted-foreground py-8 text-center">No orders in this period.</p>
                : filteredOrders.map(o => <OrderCard key={o.id} order={o} />)
              }
            </TabsContent>

            <TabsContent value="reservations" className="flex-1 overflow-y-auto space-y-2 pr-1 mt-0">
              {filteredRes.length === 0
                ? <p className="text-sm text-muted-foreground py-8 text-center">No reservations in this period.</p>
                : filteredRes.map(r => <ReservationCard key={r.id} r={r} />)
              }
            </TabsContent>
          </Tabs>
        )}

        {/* Footer summary */}
        {!isLoading && (
          <div className="shrink-0 border-t pt-3 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""} · {filteredRes.length} reservation{filteredRes.length !== 1 ? "s" : ""}
            </span>
            <span className="font-semibold text-primary tabular-nums">
              {filteredSpend.toFixed(0)} DKK spend
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

function AdminCustomers() {
  const [q,                setQ]                = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomerDto | null>(null);

  const { data: customers = [], isLoading, refetch } = useAdminCustomers(q || undefined);

  const columns: ColumnDef<AdminCustomerDto, unknown>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: info => <span className="font-medium">{info.getValue<string>()}</span>,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: info => <span className="text-muted-foreground">{info.getValue<string>()}</span>,
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: info => <span className="text-muted-foreground">{info.getValue<string>() || "—"}</span>,
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
      cell: info => (
        <span className="text-xs text-muted-foreground">
          {new Date(info.getValue<string>()).toLocaleDateString("da-DK", { timeZone: "Europe/Copenhagen", day: "2-digit", month: "short", year: "numeric" })}
        </span>
      ),
    },
    {
      accessorKey: "orderCount",
      header: "Orders",
      cell: info => <span className="tabular-nums">{info.getValue<number>()}</span>,
    },
    {
      accessorKey: "reservationCount",
      header: "Reservations",
      cell: info => <span className="tabular-nums">{info.getValue<number>()}</span>,
    },
    {
      accessorKey: "totalSpend",
      header: "Total Spend",
      cell: info => (
        <span className="font-semibold tabular-nums text-primary">
          {info.getValue<number>().toFixed(0)} DKK
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: info => (
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2.5 text-xs gap-1.5"
          onClick={() => setSelectedCustomer(info.row.original)}
        >
          <History className="h-3.5 w-3.5" />
          History
        </Button>
      ),
    },
  ];

  const toolbar = (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
      <Input
        placeholder="Search customers…"
        value={q}
        onChange={e => setQ(e.target.value)}
        className="pl-8 h-8 w-52 text-sm"
      />
    </div>
  );

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold">Customers</h1>
      <DataTable
        title="Customers"
        columns={columns}
        data={customers}
        isLoading={isLoading}
        getRowId={row => String(row.id)}
        toolbar={toolbar}
        onRefresh={refetch}
      />
      <CustomerHistoryDialog
        customer={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
      />
    </div>
  );
}
