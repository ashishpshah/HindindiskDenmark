import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Phone, MapPin, Package, Clock, Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { useAdminOrders, type AdminOrderDto, type OrderStatusHistoryDto } from "@/hooks/useAdminOrders";
import { useUpdateOrderStatus } from "@/hooks/useUpdateOrderStatus";
import { useBranches } from "@/hooks/useBranches";
import { getPriority } from "@/lib/priority";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const TZ = "Europe/Copenhagen";
function fmtDate(iso: string) {
  const d = new Date(iso);
  const day  = d.toLocaleDateString("en-GB", { timeZone: TZ, day: "2-digit" });
  const mon  = d.toLocaleDateString("en-GB", { timeZone: TZ, month: "short" });
  const yr   = d.toLocaleDateString("en-GB", { timeZone: TZ, year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: true });
  return { date: `${day} - ${mon} - ${yr}`, time };
}

export const Route = createFileRoute("/admin/orders")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search.tab as string) ?? "Placed",
  }),
  component: AdminOrders,
});

const ORDER_STATUSES = ["Placed", "Accepted", "Preparing", "Ready", "OutForDelivery", "Completed", "Cancelled"];
const TABS = ["All", ...ORDER_STATUSES];

const STATUS_LABELS: Record<string, string> = { OutForDelivery: "Out For Delivery" };

const STATUS_COLORS: Record<string, string> = {
  Placed:         "bg-blue-100 text-blue-700",
  Accepted:       "bg-indigo-100 text-indigo-700",
  Preparing:      "bg-amber-100 text-amber-700",
  Ready:          "bg-cyan-100 text-cyan-700",
  OutForDelivery: "bg-purple-100 text-purple-700",
  Completed:      "bg-green-100 text-green-700",
  Cancelled:      "bg-red-100 text-red-700",
};

const STATUS_BORDER: Record<string, string> = {
  Placed:         "border-l-blue-400",
  Accepted:       "border-l-indigo-500",
  Preparing:      "border-l-amber-400",
  Ready:          "border-l-cyan-400",
  OutForDelivery: "border-l-purple-400",
  Completed:      "border-l-green-400",
  Cancelled:      "border-l-red-400",
};

const STATUS_BTN_ACTIVE: Record<string, string> = {
  Placed:         "bg-blue-500 text-white border-blue-500",
  Accepted:       "bg-indigo-500 text-white border-indigo-500",
  Preparing:      "bg-amber-500 text-white border-amber-500",
  Ready:          "bg-cyan-500 text-white border-cyan-500",
  OutForDelivery: "bg-purple-500 text-white border-purple-500",
  Completed:      "bg-green-500 text-white border-green-500",
  Cancelled:      "bg-red-500 text-white border-red-500",
};

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  Placed:         ["Accepted", "Cancelled"],
  Accepted:       ["Preparing", "Cancelled"],
  Preparing:      ["Ready", "Cancelled"],
  Ready:          ["OutForDelivery", "Completed", "Cancelled"],
  OutForDelivery: ["Completed", "Cancelled"],
  Completed:      [],
  Cancelled:      [],
};

const STATUS_BTN_INACTIVE: Record<string, string> = {
  Placed:         "border-blue-200 text-blue-700 hover:bg-blue-50",
  Accepted:       "border-indigo-200 text-indigo-700 hover:bg-indigo-50",
  Preparing:      "border-amber-200 text-amber-700 hover:bg-amber-50",
  Ready:          "border-cyan-200 text-cyan-700 hover:bg-cyan-50",
  OutForDelivery: "border-purple-200 text-purple-700 hover:bg-purple-50",
  Completed:      "border-green-200 text-green-700 hover:bg-green-50",
  Cancelled:      "border-red-200 text-red-700 hover:bg-red-50",
};

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[status] ?? "bg-gray-100 text-gray-700"}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function OrderModal({
  order,
  onClose,
  onStatusChange,
  isUpdating,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  position,
  total,
}: {
  order: AdminOrderDto;
  onClose: () => void;
  onStatusChange: (id: number, s: string) => void;
  isUpdating: boolean;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  position: number;
  total: number;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft")  { e.preventDefault(); if (hasPrev) onPrev(); }
      if (e.key === "ArrowRight") { e.preventDefault(); if (hasNext) onNext(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasPrev, hasNext, onPrev, onNext]);

  return (
    <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            {/* Prev / Next navigation */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={onPrev} disabled={!hasPrev}
                className="rounded p-1 hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Previous order (←)"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="font-mono text-2xl font-bold text-primary">#{order.id}</span>
              <button
                onClick={onNext} disabled={!hasNext}
                className="rounded p-1 hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Next order (→)"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <span className="text-xs text-muted-foreground font-normal tabular-nums">
              {position} / {total}
            </span>
            <StatusPill status={order.status} />
            <span className="text-sm font-normal text-muted-foreground">
              {(() => { const f = fmtDate(order.createdAt); return `${f.date} ${f.time}`; })()}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Info grid */}
          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Customer</p>
              <p className="font-medium">{order.customerName || order.customerEmail}</p>
              {order.customerName && <p className="text-xs text-muted-foreground">{order.customerEmail}</p>}
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</p>
              <p className="font-medium">{order.contactName}</p>
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <a href={`tel:${order.contactPhone}`} className="hover:text-primary">{order.contactPhone}</a>
              </p>
              {order.contactEmail && <p className="text-muted-foreground text-xs">{order.contactEmail}</p>}
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Branch & Type</p>
              <p className="font-medium">{order.branchName}</p>
              <p className="text-xs text-muted-foreground">{order.orderType}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Schedule</p>
              {order.scheduledDate && order.scheduledTime ? (
                <p className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  {order.scheduledDate} at <strong className="text-foreground ml-1">{order.scheduledTime}</strong>
                </p>
              ) : (
                <p className="text-sm font-bold text-red-600">ASAP</p>
              )}
            </div>

            {order.orderType === "Delivery" && order.deliveryAddress && (
              <div className="space-y-1 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Delivery Address</p>
                <p className="flex items-start gap-1.5 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />{order.deliveryAddress}
                </p>
              </div>
            )}

            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment</p>
              <p className="text-muted-foreground">{order.paymentMethod.replace(/([A-Z])/g, " $1").trim()}</p>
              {order.couponCode && (
                <code className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{order.couponCode}</code>
              )}
            </div>
          </div>

          {/* Items */}
          {order.items && order.items.length > 0 && (
            <div className="rounded-xl border overflow-hidden">
              <div className="px-4 py-2.5 bg-muted/30 border-b">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5" /> Items ({order.itemCount})
                </p>
              </div>
              <div className="divide-y">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="font-medium">{item.name}</span>
                    <div className="flex items-center gap-4 text-muted-foreground text-xs">
                      <span>×{item.quantity}</span>
                      <span className="font-semibold text-foreground tabular-nums w-20 text-right">
                        {(item.priceAtPurchase * item.quantity).toFixed(0)} DKK
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap justify-end gap-4 text-xs text-muted-foreground border-t px-4 py-2.5 bg-muted/10">
                <span>Subtotal <strong className="text-foreground">{order.subtotal.toFixed(0)} DKK</strong></span>
                {order.deliveryFee > 0 && <span>Delivery <strong className="text-foreground">{order.deliveryFee.toFixed(0)} DKK</strong></span>}
                {order.discount > 0 && <span>Discount <strong className="text-green-600">−{order.discount.toFixed(0)} DKK</strong></span>}
                <span className="font-bold text-foreground text-sm">Total {order.total.toFixed(0)} DKK</span>
              </div>
            </div>
          )}

          {/* Status change */}
          <div className="border-t pt-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Change Status</p>
              {isUpdating && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating…
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {ORDER_STATUSES
                .filter(s => !(s === "OutForDelivery" && order.orderType !== "Delivery"))
                .map(s => {
                  const isCurrent = order.status === s;
                  const allowed = ALLOWED_TRANSITIONS[order.status] ?? [];
                  const isAllowed = allowed.includes(s);
                  const isDisabled = isCurrent || isUpdating || !isAllowed;
                  const title = !isCurrent && !isAllowed
                    ? `Cannot change from ${order.status} to ${STATUS_LABELS[s] ?? s}`
                    : undefined;
                  return (
                    <button
                      key={s}
                      disabled={isDisabled}
                      onClick={() => onStatusChange(order.id, s)}
                      title={title}
                      className={[
                        "px-4 py-2 rounded-lg border text-sm font-semibold transition-all",
                        "disabled:cursor-not-allowed",
                        isCurrent
                          ? STATUS_BTN_ACTIVE[s]
                          : isAllowed
                            ? `bg-white ${STATUS_BTN_INACTIVE[s]}`
                            : "bg-muted/40 border-muted text-muted-foreground opacity-40",
                        !isCurrent && isUpdating ? "opacity-40" : "",
                      ].join(" ")}
                    >
                      {STATUS_LABELS[s] ?? s}
                      {isCurrent && <span className="ml-1.5 opacity-60">✓</span>}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Cancellation reason */}
          {order.status === "Cancelled" && order.cancellationReason && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-700 mb-1">Cancellation Reason</p>
              <p className="text-sm text-red-800">{order.cancellationReason}</p>
            </div>
          )}

          {/* Status history — horizontal timeline */}
          {(() => {
            const raw = order.statusHistory ?? [];
            // Always start with Placed from createdAt if not already first
            const history: OrderStatusHistoryDto[] =
              raw.length > 0 && raw[0].status === "Placed"
                ? [...raw]
                : [{ status: "Placed", changedAt: order.createdAt }, ...raw];
            return (
              <div className="border-t pt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Status History
                </p>
                <div>
                  <div className="flex flex-wrap items-start gap-y-3">
                    {history.map((h, i) => {
                      const f = fmtDate(h.changedAt);
                      return (
                        <div key={i} className="flex items-start">
                          <div className="flex flex-col items-center gap-1.5 min-w-[108px] px-1">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${STATUS_COLORS[h.status] ?? "bg-gray-100 text-gray-700"}`}>
                              {STATUS_LABELS[h.status] ?? h.status}
                            </span>
                            <div className="text-center">
                              <div className="text-[10px] text-muted-foreground tabular-nums leading-tight">{f.date}</div>
                              <div className="text-[10px] text-muted-foreground tabular-nums leading-tight">{f.time}</div>
                            </div>
                          </div>
                          {i < history.length - 1 && (
                            <div className="pt-2">
                              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AdminOrders() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const [filterBranchId, setFilterBranchId] = useState<number | undefined>();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [recentlyUpdated, setRecentlyUpdated] = useState<Record<number, string>>({});
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<{ orderId: number } | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const { data: rawOrders = [], isLoading, refetch } = useAdminOrders({ branchId: filterBranchId });
  const { data: branches = [] } = useBranches();
  const updateStatus = useUpdateOrderStatus();

  const orders = [...rawOrders].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const filteredOrders = tab === "All" ? orders : orders.filter(o => o.status === tab);
  const selectedOrder = selectedOrderId != null ? orders.find(o => o.id === selectedOrderId) ?? null : null;

  const countForTab = (t: string) =>
    t === "All" ? orders.length : orders.filter(o => o.status === t).length;

  const setTab = (t: string) =>
    navigate({ search: (prev: Record<string, unknown>) => ({ ...prev, tab: t }) });

  const handleStatusChange = async (id: number, status: string, cancellationReason?: string) => {
    setUpdatingId(id);
    try {
      await updateStatus.mutateAsync({ id, status, cancellationReason });
      const timeStr = new Date().toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" });
      setRecentlyUpdated(prev => ({ ...prev, [id]: timeStr }));
      setTimeout(() => {
        setRecentlyUpdated(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }, 8000);
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="font-display text-3xl font-bold">Orders</h1>
        <div className="flex items-center gap-2">
          <Select
            value={filterBranchId?.toString() ?? "__all"}
            onValueChange={v => setFilterBranchId(v === "__all" ? undefined : Number(v))}
          >
            <SelectTrigger className="h-8 w-48 text-xs"><SelectValue placeholder="All branches" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all" className="text-xs">All branches</SelectItem>
              {branches.map(b => (
                <SelectItem key={b.id} value={String(b.id)} className="text-xs">{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="h-8 text-xs">
            Refresh
          </Button>
        </div>
      </div>

      {/* Tab strip */}
      <div className="overflow-x-auto pb-1 -mx-1 px-1">
        <div className="inline-flex items-center rounded-lg bg-muted p-1 gap-0.5 min-w-max">
          {TABS.map(t => {
            const count = countForTab(t);
            const isActive = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={[
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap",
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
                ].join(" ")}
              >
                {STATUS_LABELS[t] ?? t}
                <span className={[
                  "inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold min-w-[18px]",
                  isActive ? "bg-primary/10 text-primary" : "bg-muted-foreground/15 text-muted-foreground",
                ].join(" ")}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Order list */}
      <div className="rounded-xl border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading orders…
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No orders{tab !== "All" ? ` with status "${STATUS_LABELS[tab] ?? tab}"` : ""}.
          </div>
        ) : (
          <div className="divide-y">
            {/* Column headers */}
            <div className="flex items-center gap-3 px-4 py-2.5 bg-muted/50 border-l-4 border-l-transparent">
              <div className="w-[80px] shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Order</div>
              <div className="flex-1 min-w-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Customer</div>
              <div className="hidden lg:block w-[148px] shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground text-right">Date & Time</div>
              <div className="hidden sm:block w-[80px] shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Priority</div>
              <div className="w-[126px] shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Status</div>
              <div className="hidden md:block w-[76px] shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground text-right">Total</div>
              <div className="w-4 shrink-0" />
            </div>

            {filteredOrders.map(order => {
              const priority = getPriority(order.scheduledDate, order.scheduledTime);
              const isHighlighted = !!recentlyUpdated[order.id];
              const isBeingUpdated = updatingId === order.id;
              const showPriority =
                (priority.level === "asap" || priority.level === "urgent") &&
                order.status !== "Completed" && order.status !== "Cancelled";

              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  className={[
                    "flex items-center gap-3 px-4 py-3.5 cursor-pointer select-none transition-colors border-l-4",
                    STATUS_BORDER[order.status] ?? "border-l-gray-200",
                    isHighlighted
                      ? "bg-amber-50 hover:bg-amber-100/80"
                      : "hover:bg-muted/30",
                  ].join(" ")}
                >
                  {/* Order */}
                  <div className="w-[80px] shrink-0">
                    <div className={[
                      "font-mono text-lg font-bold leading-tight flex items-center gap-1",
                      isBeingUpdated ? "text-muted-foreground" : "text-primary",
                    ].join(" ")}>
                      #{order.id}
                      {isBeingUpdated && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    </div>
                    {isHighlighted && (
                      <div className="text-[10px] font-medium text-amber-600">
                        Updated {recentlyUpdated[order.id]}
                      </div>
                    )}
                  </div>

                  {/* Customer */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{order.customerName || order.customerEmail}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {order.branchName.replace("Hind Indisk ", "")} · {order.orderType} · {order.itemCount} items
                    </div>
                  </div>

                  {/* Date & Time */}
                  {(() => {
                    const f = fmtDate(order.createdAt);
                    return (
                      <div className="hidden lg:flex flex-col items-end w-[148px] shrink-0 text-right">
                        <span className="text-xs font-medium text-foreground tabular-nums">{f.date}</span>
                        <span className="text-[11px] text-muted-foreground tabular-nums">{f.time}</span>
                      </div>
                    );
                  })()}

                  {/* Priority */}
                  <div className="hidden sm:flex w-[80px] shrink-0">
                    {showPriority && (
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold ${priority.badge}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${priority.dot}`} />
                        {priority.label}
                      </span>
                    )}
                  </div>

                  {/* Status */}
                  <div className="w-[126px] shrink-0">
                    <StatusPill status={order.status} />
                  </div>

                  {/* Total */}
                  <span className="hidden md:block w-[76px] shrink-0 font-semibold tabular-nums text-sm whitespace-nowrap text-right">
                    {order.total.toFixed(0)} DKK
                  </span>

                  {/* Chevron */}
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel confirmation dialog */}
      {cancelConfirm && (
        <Dialog open onOpenChange={open => { if (!open) { setCancelConfirm(null); setCancelReason(""); } }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-destructive">Cancel Order #{cancelConfirm.orderId}?</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <p className="text-sm text-muted-foreground">
                This action will cancel the order and notify the customer by email.
              </p>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Reason <span className="font-normal normal-case">(optional)</span>
                </Label>
                <Textarea
                  rows={3}
                  placeholder="e.g. Item out of stock, branch closing early…"
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => { setCancelConfirm(null); setCancelReason(""); }}>
                Keep Order
              </Button>
              <Button
                variant="destructive"
                disabled={updatingId === cancelConfirm.orderId}
                onClick={async () => {
                  const { orderId } = cancelConfirm;
                  const reason = cancelReason.trim() || undefined;
                  setCancelConfirm(null);
                  setCancelReason("");
                  await handleStatusChange(orderId, "Cancelled", reason);
                }}
              >
                {updatingId === cancelConfirm.orderId
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Cancelling…</>
                  : "Yes, Cancel Order"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (() => {
        const idx = filteredOrders.findIndex(o => o.id === selectedOrder.id);
        return (
          <OrderModal
            order={selectedOrder}
            onClose={() => setSelectedOrderId(null)}
            onStatusChange={(id, status) => {
              if (status === "Cancelled") { setCancelConfirm({ orderId: id }); }
              else handleStatusChange(id, status);
            }}
            isUpdating={updatingId === selectedOrder.id}
            hasPrev={idx > 0}
            hasNext={idx < filteredOrders.length - 1}
            onPrev={() => setSelectedOrderId(filteredOrders[idx - 1].id)}
            onNext={() => setSelectedOrderId(filteredOrders[idx + 1].id)}
            position={idx + 1}
            total={filteredOrders.length}
          />
        );
      })()}
    </div>
  );
}
