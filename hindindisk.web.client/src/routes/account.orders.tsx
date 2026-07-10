import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { ShoppingBag, Loader2, MapPin, Banknote, UserCog, User, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMyOrders } from "@/hooks/useMyOrders";
import { useOrderStatuses } from "@/hooks/useOrderStatuses";
import { useAuth, type User as AuthUser } from "@/context/AuthContext";
import { useI18n } from "@/i18n/I18nProvider";
import { formatDateTime } from "@/lib/dateFormat";

export const Route = createFileRoute("/account/orders")({ component: OrdersPage });

const PAGE_SIZES = [5, 10, 20, 50];

function hexToRgba(hex: string, alpha: number): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function statusColorStyle(statusName: string, statuses: { name: string; color?: string | null }[]) {
  const s = statuses.find(st => st.name === statusName);
  return s?.color ?? "#6b7280";
}

function orderRelation(contactName: string, contactEmail: string | undefined, placedByName: string | null | undefined, user: AuthUser | null) {
  if (placedByName) return { type: "by" as const, name: placedByName };
  if (!user) return null;
  const isSelf = contactName.trim().toLowerCase() === user.name.trim().toLowerCase();
  if (isSelf) return null;
  return { type: "for" as const, name: contactName.trim() || contactEmail || "" };
}

function OrdersPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { data: orders = [], isLoading, isError } = useMyOrders(true);
  const { data: allStatuses = [] } = useOrderStatuses();

  const activeStatuses = useMemo(() =>
    allStatuses.filter(s => s.isActive).sort((a, b) => a.displayOrder - b.displayOrder),
    [allStatuses]
  );

  const [dateFrom,      setDateFrom]      = useState("");
  const [dateTo,        setDateTo]        = useState("");
  const [statusFilter,  setStatusFilter]  = useState("");
  const [typeFilter,    setTypeFilter]    = useState("");
  const [page,          setPage]          = useState(1);
  const [pageSize,      setPageSize]      = useState(10);

  const hasFilters = !!(dateFrom || dateTo || statusFilter || typeFilter);

  function resetFilters() {
    setDateFrom(""); setDateTo(""); setStatusFilter(""); setTypeFilter(""); setPage(1);
  }

  function updateFilter<T>(setter: (v: T) => void, value: T) {
    setter(value);
    setPage(1);
  }

  const filtered = orders.filter(o => {
    if (statusFilter && o.status !== statusFilter) return false;
    if (typeFilter   && o.orderType !== typeFilter) return false;
    if (dateFrom) {
      const d = new Date(o.createdAt);
      if (d < new Date(dateFrom)) return false;
    }
    if (dateTo) {
      const d   = new Date(o.createdAt);
      const end = new Date(dateTo);
      end.setDate(end.getDate() + 1);
      if (d >= end) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const rangeFrom  = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeTo    = Math.min(safePage * pageSize, filtered.length);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-3xl border bg-card p-10 text-center shadow-soft">
        <p className="text-muted-foreground">{t("orders.errorLoad")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-semibold">
        {t("orders.title")}
        {orders.length > 0 && (
          <span className="ml-2 text-base font-normal text-muted-foreground">({orders.length})</span>
        )}
      </h2>

      {/* ── Filter bar ─────────────────────────────────────────────────── */}
      {orders.length > 0 && (
        <div className="rounded-2xl border bg-card p-3 shadow-soft">
          <div className="flex flex-wrap items-center gap-2">
            {/* Date from */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-muted-foreground whitespace-nowrap">From</label>
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={e => updateFilter(setDateFrom, e.target.value)}
                className="h-8 rounded-lg border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Date to */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-muted-foreground whitespace-nowrap">To</label>
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={e => updateFilter(setDateTo, e.target.value)}
                className="h-8 rounded-lg border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Status */}
            <Select value={statusFilter || "__all"} onValueChange={v => updateFilter(setStatusFilter, v === "__all" ? "" : v)}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all" className="text-xs">All Statuses</SelectItem>
                {activeStatuses.map(s => (
                  <SelectItem key={s.name} value={s.name} className="text-xs">
                    {s.nameDa ?? s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Type */}
            <Select value={typeFilter || "__all"} onValueChange={v => updateFilter(setTypeFilter, v === "__all" ? "" : v)}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all"    className="text-xs">All Types</SelectItem>
                <SelectItem value="Pickup"   className="text-xs">Pickup</SelectItem>
                <SelectItem value="Delivery" className="text-xs">Delivery</SelectItem>
              </SelectContent>
            </Select>

            {/* Reset */}
            {hasFilters && (
              <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs text-muted-foreground" onClick={resetFilters}>
                <X className="h-3 w-3" /> Reset
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ── Empty state ────────────────────────────────────────────────── */}
      {orders.length === 0 && (
        <div className="rounded-3xl border bg-card p-10 text-center shadow-soft">
          <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
          <div className="mt-3 text-muted-foreground">{t("orders.noOrders")}</div>
          <Button asChild className="mt-4 gradient-primary text-primary-foreground">
            <Link to="/menu">{t("orders.browseMenu")}</Link>
          </Button>
        </div>
      )}

      {/* ── No results after filter ────────────────────────────────────── */}
      {orders.length > 0 && filtered.length === 0 && (
        <div className="rounded-3xl border bg-card p-10 text-center shadow-soft">
          <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
          <div className="mt-3 text-muted-foreground">No orders match the current filters.</div>
          <Button variant="outline" size="sm" className="mt-4" onClick={resetFilters}>Clear filters</Button>
        </div>
      )}

      {/* ── Order cards ────────────────────────────────────────────────── */}
      {paginated.map((o) => {
        const relation = orderRelation(o.contactName, o.contactEmail, o.placedByName, user);
        const color = statusColorStyle(o.status, activeStatuses);
        return (
        <div key={o.id} className="rounded-3xl border bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-mono text-sm font-semibold text-foreground">#{o.id}</div>
              <div className="text-sm font-semibold text-foreground">{formatDateTime(o.createdAt)}</div>
              <div className="text-sm text-muted-foreground">{o.branchName} · {o.orderType}</div>
              {relation?.type === "by" && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-600">
                  <UserCog className="h-3.5 w-3.5 shrink-0" />
                  <span>Created by <strong>{relation.name}</strong></span>
                </div>
              )}
              {relation?.type === "for" && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-sky-600">
                  <User className="h-3.5 w-3.5 shrink-0" />
                  <span>For <strong>{relation.name}</strong></span>
                </div>
              )}
            </div>
            <div className="text-right shrink-0">
              <div className="font-display text-xl">{o.total.toFixed(0)} DKK</div>
              <span
                className="mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={{ backgroundColor: hexToRgba(color, 0.12), color }}
              >
                {activeStatuses.find(s => s.name === o.status)?.nameDa ?? o.status}
              </span>
            </div>
          </div>

          <div className="mt-3 text-sm text-muted-foreground">
            {o.items.map((i) => `${i.quantity}× ${i.name}`).join(" · ")}
          </div>

          {o.deliveryAddress && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>{o.deliveryAddress}</span>
            </div>
          )}

          <div className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${o.orderType === "Pickup" ? "text-amber-600" : "text-muted-foreground"}`}>
            <Banknote className="h-3.5 w-3.5 shrink-0" />
            <span>{o.orderType === "Pickup" ? t("checkout.payAtStore") : t("checkout.cashOnDelivery")}</span>
          </div>

          {o.status === "Cancelled" && o.cancellationReason && (
            <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
              <p className="text-xs font-semibold text-red-700">Cancellation reason</p>
              <p className="text-xs text-red-800 mt-0.5">{o.cancellationReason}</p>
            </div>
          )}

          <div className="mt-3">
            <Button asChild size="sm" variant="outline">
              <Link to="/order-tracking" search={{ id: String(o.id) }}>{t("orders.track")}</Link>
            </Button>
          </div>
        </div>
        );
      })}

      {/* ── Pagination bar ─────────────────────────────────────────────── */}
      {filtered.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3 shadow-soft">
          <p className="text-xs text-muted-foreground">
            Showing <span className="font-medium text-foreground">{rangeFrom}–{rangeTo}</span> of{" "}
            <span className="font-medium text-foreground">{filtered.length}</span> orders
            {hasFilters && orders.length !== filtered.length && (
              <span className="ml-1">(filtered from {orders.length})</span>
            )}
          </p>

          <div className="flex items-center gap-1">
            <Button
              variant="outline" size="icon"
              className="h-7 w-7"
              disabled={safePage === 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="min-w-[80px] text-center text-xs">
              Page {safePage} of {totalPages}
            </span>
            <Button
              variant="outline" size="icon"
              className="h-7 w-7"
              disabled={safePage === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Rows per page</span>
            <Select
              value={String(pageSize)}
              onValueChange={v => { setPageSize(Number(v)); setPage(1); }}
            >
              <SelectTrigger className="h-7 w-16 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map(n => (
                  <SelectItem key={n} value={String(n)} className="text-xs">{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
