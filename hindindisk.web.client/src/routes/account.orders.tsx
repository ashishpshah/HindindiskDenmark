import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { ShoppingBag, Loader2, MapPin, Banknote, User, Users, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMyOrders } from "@/hooks/useMyOrders";
import { useOrderStatuses } from "@/hooks/useOrderStatuses";
import { useAuth, type User as AuthUser } from "@/context/AuthContext";
import { useI18n } from "@/i18n/I18nProvider";
import { formatDateTime, formatDateStr, formatTimeStr } from "@/lib/dateFormat";

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

function orderRelation(
  orderUserId: number,
  contactName: string,
  contactEmail: string | undefined,
  ownerName: string | null | undefined,
  user: AuthUser | null
) {
  if (!user) return null;

  const sameAccount = orderUserId === user.id;
  const sameEmail = !!contactEmail && contactEmail.trim().toLowerCase() === user.email.trim().toLowerCase();

  // Own account, but contact details point elsewhere (e.g. ordered as a gift) — "Created for {name}".
  if (sameAccount && !sameEmail) return { type: "for" as const, name: contactName.trim() || contactEmail || "" };

  // Different account, but same contact email as the viewer — "Created by {name}".
  if (!sameAccount && sameEmail) return { type: "linked" as const, name: ownerName?.trim() || contactName.trim() || contactEmail || "" };

  return null;
}

function OrdersPage() {
  const { t, lang } = useI18n();
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
    const orderDate = o.scheduledDate ?? o.createdAt.split("T")[0];
    if (dateFrom && orderDate < dateFrom) return false;
    if (dateTo   && orderDate > dateTo)   return false;
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
              <label className="text-xs text-muted-foreground whitespace-nowrap">{t("filters.from")}</label>
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={e => updateFilter(setDateFrom, e.target.value)}
                className="h-8 rounded-lg border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                data-tagid="input-account-orders-date-from"
              />
            </div>

            {/* Date to */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-muted-foreground whitespace-nowrap">{t("filters.to")}</label>
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={e => updateFilter(setDateTo, e.target.value)}
                className="h-8 rounded-lg border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                data-tagid="input-account-orders-date-to"
              />
            </div>

            {/* Status */}
            <Select value={statusFilter || "__all"} onValueChange={v => updateFilter(setStatusFilter, v === "__all" ? "" : v)}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue placeholder={t("filters.allStatuses")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all" className="text-xs">{t("filters.allStatuses")}</SelectItem>
                {activeStatuses.map(s => (
                  <SelectItem key={s.name} value={s.name} className="text-xs">
                    {lang === "da" ? (s.nameDa ?? s.name) : s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Type */}
            <Select value={typeFilter || "__all"} onValueChange={v => updateFilter(setTypeFilter, v === "__all" ? "" : v)}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue placeholder={t("filters.allTypes")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all"    className="text-xs">{t("filters.allTypes")}</SelectItem>
                <SelectItem value="Pickup"   className="text-xs">{t("checkout.pickup")}</SelectItem>
                <SelectItem value="Delivery" className="text-xs">{t("checkout.delivery")}</SelectItem>
              </SelectContent>
            </Select>

            {/* Reset */}
            {hasFilters && (
              <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs text-muted-foreground" onClick={resetFilters} data-tagid="button-account-orders-reset-filters">
                <X className="h-3 w-3" /> {t("filters.reset")}
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
          <Button asChild className="mt-4 gradient-primary text-primary-foreground" data-tagid="button-account-orders-browse-menu">
            <Link to="/menu">{t("orders.browseMenu")}</Link>
          </Button>
        </div>
      )}

      {/* ── No results after filter ────────────────────────────────────── */}
      {orders.length > 0 && filtered.length === 0 && (
        <div className="rounded-3xl border bg-card p-10 text-center shadow-soft">
          <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
          <div className="mt-3 text-muted-foreground">{t("filters.noMatchOrders")}</div>
          <Button variant="outline" size="sm" className="mt-4" onClick={resetFilters} data-tagid="button-account-orders-clear-filters">{t("filters.clearFilters")}</Button>
        </div>
      )}

      {/* ── Order cards ────────────────────────────────────────────────── */}
      {paginated.map((o) => {
        const relation = orderRelation(o.userId, o.contactName, o.contactEmail, o.ownerName, user);
        const color = statusColorStyle(o.status, activeStatuses);
        return (
        <div key={o.id} className="rounded-3xl border bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-mono text-sm font-semibold text-foreground">#{o.id}</div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                <span className="font-semibold text-primary">
                  {o.scheduledDate && o.scheduledTime
                    ? `${formatDateStr(o.scheduledDate)} ${formatTimeStr(o.scheduledTime)}`
                    : t("orders.asap")}
                </span>
                <span className="text-muted-foreground">|</span>
                <span className="font-medium text-foreground">{o.branchName}</span>
                <span className="text-muted-foreground">|</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  o.orderType === "Pickup"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    : "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400"
                }`}>
                  {o.orderType === "Pickup" ? t("checkout.pickup") : t("checkout.delivery")}
                </span>
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">{t("orders.createdAt")} {formatDateTime(o.createdAt)}</div>
              {relation?.type === "for" && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-sky-600">
                  <User className="h-3.5 w-3.5 shrink-0" />
                  <span>{t("filters.for")} <strong>{relation.name}</strong></span>
                </div>
              )}
              {relation?.type === "linked" && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-violet-600">
                  <Users className="h-3.5 w-3.5 shrink-0" />
                  <span>{t("account.createdBy")} <strong>{relation.name}</strong></span>
                </div>
              )}
            </div>
            <div className="text-right shrink-0">
              <div className="font-display text-xl">{o.total.toFixed(0)} DKK</div>
              <span
                className="mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={{ backgroundColor: hexToRgba(color, 0.12), color }}
              >
                {lang === "da"
                ? (activeStatuses.find(s => s.name === o.status)?.nameDa ?? o.status)
                : (activeStatuses.find(s => s.name === o.status)?.name ?? o.status)}
              </span>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2">
            {o.items.map((i, idx) => {
              const name     = lang === "da" && i.nameDa ? i.nameDa : i.name;
              const subTotal = i.quantity * i.priceAtPurchase;
              const isLeft   = idx % 2 === 0;
              return (
                <div key={i.menuItemId} className={`flex items-start gap-1.5 py-1.5 text-xs ${isLeft ? "border-r border-border pr-3" : "pl-3"}`}>
                  <span className="font-mono text-muted-foreground shrink-0">{i.code ? i.code : "—"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">{name}</div>
                    <div className="text-muted-foreground tabular-nums">
                      {i.quantity} × {i.priceAtPurchase.toFixed(0)} DKK
                      <span className="ml-1 font-semibold text-foreground">= {subTotal.toFixed(0)} DKK</span>
                    </div>
                  </div>
                </div>
              );
            })}
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
              <p className="text-xs font-semibold text-red-700">{t("orders.cancellationReason")}</p>
              <p className="text-xs text-red-800 mt-0.5">{o.cancellationReason}</p>
            </div>
          )}

          <div className="mt-3">
            <Button asChild size="sm" variant="outline" data-tagid={`button-account-orders-track-${o.id}`}>
              <Link to="/order-tracking" search={{ id: o.id }}>{t("orders.track")}</Link>
            </Button>
          </div>
        </div>
        );
      })}

      {/* ── Pagination bar ─────────────────────────────────────────────── */}
      {filtered.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3 shadow-soft">
          <p className="text-xs text-muted-foreground">
            {t("filters.showing")} <span className="font-medium text-foreground">{rangeFrom}–{rangeTo}</span> {t("filters.of")}{" "}
            <span className="font-medium text-foreground">{filtered.length}</span> {t("orders.many")}
            {hasFilters && orders.length !== filtered.length && (
              <span className="ml-1">({t("filters.filteredFrom")} {orders.length})</span>
            )}
          </p>

          <div className="flex items-center gap-1">
            <Button
              variant="outline" size="icon"
              className="h-7 w-7"
              disabled={safePage === 1}
              onClick={() => setPage(p => p - 1)}
              data-tagid="button-account-orders-prev-page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="min-w-[80px] text-center text-xs">
              {t("filters.page")} {safePage} {t("filters.of")} {totalPages}
            </span>
            <Button
              variant="outline" size="icon"
              className="h-7 w-7"
              disabled={safePage === totalPages}
              onClick={() => setPage(p => p + 1)}
              data-tagid="button-account-orders-next-page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">{t("filters.rowsPerPage")}</span>
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
