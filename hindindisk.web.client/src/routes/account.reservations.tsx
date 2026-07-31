import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarCheck, Loader2, ChevronLeft, ChevronRight, X, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMyReservations } from "@/hooks/useMyReservations";
import { useAuth, type User as AuthUser } from "@/context/AuthContext";
import { useI18n } from "@/i18n/I18nProvider";
import { formatDateStr, formatTimeStr, formatDateTime } from "@/lib/dateFormat";

export const Route = createFileRoute("/account/reservations")({ component: ReservationsPage });

const RESERVATION_STATUSES = ["Pending", "Confirmed", "Cancelled"];
const PAGE_SIZES            = [5, 10, 20, 50];

const STATUS_COLORS: Record<string, string> = {
  Confirmed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Pending:   "bg-muted text-muted-foreground",
  Cancelled: "bg-red-100 text-red-700",
};

function reservationRelation(
  reservationUserId: number,
  contactName: string,
  contactEmail: string,
  ownerName: string | null | undefined,
  user: AuthUser | null
) {
  if (!user) return null;

  const sameAccount = reservationUserId === user.id;
  const sameEmail = contactEmail.trim().toLowerCase() === user.email.trim().toLowerCase();

  // Own account, but contact details point elsewhere (e.g. booked as a gift) — "Created for {name}".
  if (sameAccount && !sameEmail) return { type: "for" as const, name: contactName.trim() || contactEmail };

  // Different account, but same contact email as the viewer — "Created by {name}".
  if (!sameAccount && sameEmail) return { type: "linked" as const, name: ownerName?.trim() || contactName.trim() || contactEmail };

  return null;
}

function ReservationsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { data: list = [], isLoading, isError } = useMyReservations(true);

  const [dateFrom,     setDateFrom]     = useState("");
  const [dateTo,       setDateTo]       = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page,         setPage]         = useState(1);
  const [pageSize,     setPageSize]     = useState(10);

  const hasFilters = !!(dateFrom || dateTo || statusFilter);

  function resetFilters() {
    setDateFrom(""); setDateTo(""); setStatusFilter(""); setPage(1);
  }

  function updateFilter<T>(setter: (v: T) => void, value: T) {
    setter(value);
    setPage(1);
  }

  const filtered = list.filter(r => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (dateFrom && r.date < dateFrom) return false;
    if (dateTo   && r.date > dateTo)   return false;
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
        <p className="text-muted-foreground">{t("reservations.errorLoad")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold">
          {t("reservations.title")}
          {list.length > 0 && (
            <span className="ml-2 text-base font-normal text-muted-foreground">({list.length})</span>
          )}
        </h2>
        <Button asChild size="sm" className="gradient-primary text-primary-foreground" data-tagid="button-account-reservations-new">
          <Link to="/reservation">{t("reservations.newReservation")}</Link>
        </Button>
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────────── */}
      {list.length > 0 && (
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
                data-tagid="input-account-reservations-date-from"
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
                data-tagid="input-account-reservations-date-to"
              />
            </div>

            {/* Status */}
            <Select value={statusFilter || "__all"} onValueChange={v => updateFilter(setStatusFilter, v === "__all" ? "" : v)}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue placeholder={t("filters.allStatuses")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all" className="text-xs">{t("filters.allStatuses")}</SelectItem>
                {RESERVATION_STATUSES.map(s => (
                  <SelectItem key={s} value={s} className="text-xs">
                    {s === "Confirmed" ? t("status.confirmed")
                      : s === "Pending" ? t("status.pending")
                      : s === "Cancelled" ? t("status.cancelled")
                      : s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Reset */}
            {hasFilters && (
              <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs text-muted-foreground" onClick={resetFilters} data-tagid="button-account-reservations-reset-filters">
                <X className="h-3 w-3" /> {t("filters.reset")}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ── Empty state ────────────────────────────────────────────────── */}
      {list.length === 0 && (
        <div className="rounded-3xl border bg-card p-10 text-center shadow-soft">
          <CalendarCheck className="mx-auto h-10 w-10 text-muted-foreground" />
          <div className="mt-3 text-muted-foreground">{t("reservations.noReservations")}</div>
          <Button asChild className="mt-4 gradient-primary text-primary-foreground" data-tagid="button-account-reservations-book-table">
            <Link to="/reservation">{t("reservations.bookTable")}</Link>
          </Button>
        </div>
      )}

      {/* ── No results after filter ────────────────────────────────────── */}
      {list.length > 0 && filtered.length === 0 && (
        <div className="rounded-3xl border bg-card p-10 text-center shadow-soft">
          <CalendarCheck className="mx-auto h-10 w-10 text-muted-foreground" />
          <div className="mt-3 text-muted-foreground">{t("filters.noMatchReservations")}</div>
          <Button variant="outline" size="sm" className="mt-4" onClick={resetFilters} data-tagid="button-account-reservations-clear-filters">{t("filters.clearFilters")}</Button>
        </div>
      )}

      {/* ── Reservation cards ──────────────────────────────────────────── */}
      {paginated.map((r) => {
        const relation = reservationRelation(r.userId, r.contactName, r.contactEmail, r.ownerName, user);
        return (
          <div key={r.id} className="rounded-3xl border bg-card p-5 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-mono text-sm font-semibold text-foreground">#{r.id}</div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                  <span className="font-semibold text-primary">
                    {formatDateStr(r.date)} {formatTimeStr(r.timeSlot)}
                  </span>
                  <span className="text-muted-foreground">|</span>
                  <span className="font-medium text-foreground">{r.branchName}</span>
                  <span className="text-muted-foreground">|</span>
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                    {r.guestCount} {r.guestCount === 1 ? t("reservations.guest") : t("reservations.guests")}
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">{t("reservations.createdAt")} {formatDateTime(r.createdAt)}</div>
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
                {r.specialRequests && (
                  <div className="mt-1 text-xs text-muted-foreground italic">"{r.specialRequests}"</div>
                )}
              </div>
              <div className="shrink-0">
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[r.status] ?? "bg-muted text-muted-foreground"}`}>
                  {r.status === "Confirmed" ? t("status.confirmed")
                    : r.status === "Pending" ? t("status.pending")
                    : r.status === "Cancelled" ? t("status.cancelled")
                    : r.status}
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {/* ── Pagination bar ─────────────────────────────────────────────── */}
      {filtered.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3 shadow-soft">
          {/* Left: result range */}
          <p className="text-xs text-muted-foreground">
            {t("filters.showing")} <span className="font-medium text-foreground">{rangeFrom}–{rangeTo}</span> {t("filters.of")}{" "}
            <span className="font-medium text-foreground">{filtered.length}</span> {t("reservations.many")}
            {hasFilters && list.length !== filtered.length && (
              <span className="ml-1">({t("filters.filteredFrom")} {list.length})</span>
            )}
          </p>

          {/* Centre: prev / page / next */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline" size="icon"
              className="h-7 w-7"
              disabled={safePage === 1}
              onClick={() => setPage(p => p - 1)}
              data-tagid="button-account-reservations-prev-page"
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
              data-tagid="button-account-reservations-next-page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Right: rows per page */}
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
