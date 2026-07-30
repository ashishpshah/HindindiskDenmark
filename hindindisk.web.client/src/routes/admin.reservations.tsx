import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { UserCheck, UserX, Search, ChevronRight, Loader2, ChevronLeft, ChevronsLeft, ChevronsRight, Mail } from "lucide-react";
import { getPriority } from "@/lib/priority";
import { formatDate, formatTime, formatDateStr, formatTimeStr } from "@/lib/dateFormat";
import { toast } from "sonner";
import { useAdminReservations, type AdminReservationDto } from "@/hooks/useAdminReservations";
import { useUpdateReservationStatus } from "@/hooks/useUpdateReservationStatus";
import { useResendReservationEmail } from "@/hooks/useResendEmail";
import { useBranches } from "@/hooks/useBranches";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { todayInDenmark } from "@/lib/denmarkTime";

export const Route = createFileRoute("/admin/reservations")({
  component: AdminReservations,
});

type DatePreset = "today" | "tomorrow" | "next-week" | "next-month" | "custom";

function fmtIso(dt: Date): string {
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

function getPresetRange(preset: DatePreset, customFrom: string, customTo: string): { from: string; to: string } | null {
  const today = todayInDenmark();
  const d = new Date(today); // ISO date-only → parsed as UTC midnight; use UTC methods throughout
  switch (preset) {
    case "today": return { from: today, to: today };
    case "tomorrow": { const t = new Date(d); t.setUTCDate(d.getUTCDate() + 1); const s = fmtIso(t); return { from: s, to: s }; }
    case "next-week": {
      const f = new Date(d); f.setUTCDate(d.getUTCDate() + 1);
      const t = new Date(d); t.setUTCDate(d.getUTCDate() + 7);
      return { from: fmtIso(f), to: fmtIso(t) };
    }
    case "next-month": {
      const f = new Date(d); f.setUTCDate(d.getUTCDate() + 1);
      const t = new Date(d); t.setUTCDate(d.getUTCDate() + 30);
      return { from: fmtIso(f), to: fmtIso(t) };
    }
    case "custom":
      if (!customFrom && !customTo) return null;
      return { from: customFrom || "0000-01-01", to: customTo || "9999-12-31" };
  }
}

const PRESET_LABELS: { key: DatePreset; label: string }[] = [
  { key: "today",      label: "Today" },
  { key: "tomorrow",   label: "Tomorrow" },
  { key: "next-week",  label: "Next Week" },
  { key: "next-month", label: "Next Month" },
  { key: "custom",     label: "Custom" },
];

const STATUS_TABS = ["All", "Pending", "Confirmed", "Cancelled"] as const;

const PAGE_SIZES = [20, 50, 100];

const STATUS_HEX: Record<string, string> = {
  Pending:   "#F59E0B",
  Confirmed: "#10B981",
  Cancelled: "#EF4444",
};

function hexToRgba(hex: string, alpha: number): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function ReservationExpandedRow({
  r,
  onStatus,
  isUpdating,
}: {
  r: AdminReservationDto;
  onStatus: (id: number, s: string) => void;
  isUpdating: boolean;
}) {
  const resendEmail = useResendReservationEmail();
  return (
    <div className="grid gap-4 sm:grid-cols-3 text-sm">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</p>
        <p className="font-medium">{r.contactName}</p>
        <p className="text-muted-foreground">{r.contactPhone}</p>
        <p className="text-muted-foreground text-xs">{r.contactEmail}</p>
      </div>
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reservation Date &amp; Time</p>
        <p className="font-medium tabular-nums">{formatDateStr(r.date)} at {formatTimeStr(r.timeSlot)}</p>
      </div>
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Created</p>
        <p className="font-medium tabular-nums">{formatDate(r.createdAt)} {formatTime(r.createdAt)}</p>
      </div>
      {r.specialRequests && (
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Special Requests</p>
          <p className="italic text-muted-foreground">"{r.specialRequests}"</p>
        </div>
      )}
      {r.status === "Cancelled" && r.cancellationReason && (
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Cancellation Reason</p>
          <p className="text-sm text-red-700">{r.cancellationReason}</p>
        </div>
      )}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</p>
        <div className="flex gap-2 flex-wrap">
          {r.status !== "Confirmed" && (
            <Button size="sm" variant="outline" className="text-green-700 border-green-200 hover:bg-green-50"
              disabled={isUpdating} onClick={() => onStatus(r.id, "Confirmed")} data-tagid={`button-reservations-confirm-${r.id}`}>
              <UserCheck className="mr-1.5 h-3.5 w-3.5" /> Confirm
            </Button>
          )}
          <Button size="sm" variant="outline"
            disabled={resendEmail.isPending}
            onClick={() => {
              resendEmail.mutate(r.id, {
                onSuccess: () => toast.success(`Resent "${r.status}" email to guest`),
                onError: (e) => toast.error((e as Error).message || "Failed to resend email"),
              });
            }}
            data-tagid={`button-reservations-resend-email-${r.id}`}>
            {resendEmail.isPending
              ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              : <Mail className="mr-1.5 h-3.5 w-3.5" />}
            Resend Email
          </Button>
          {r.status !== "Cancelled" && (
            <Button size="sm" variant="outline" className="text-red-700 border-red-200 hover:bg-red-50"
              disabled={isUpdating} onClick={() => onStatus(r.id, "Cancelled")} data-tagid={`button-reservations-cancel-${r.id}`}>
              <UserX className="mr-1.5 h-3.5 w-3.5" /> Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminReservations() {
  const [status, setStatus] = useState("All");
  const [branchId, setBranchId] = useState<number | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [preset, setPreset] = useState<DatePreset>("today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const dateRange = useMemo(
    () => getPresetRange(preset, customFrom, customTo),
    [preset, customFrom, customTo],
  );

  const { data: reservationsData, isLoading, isError, error, refetch } = useAdminReservations({
    status:   status !== "All" ? status : undefined,
    branchId,
    dateFrom: dateRange?.from,
    dateTo:   dateRange?.to,
    search:   search || undefined,
    page,
    pageSize,
  });
  const { data: branches = [] } = useBranches();
  const updateStatus = useUpdateReservationStatus();

  const rawReservations = reservationsData?.items ?? [];
  const totalReservations = reservationsData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalReservations / pageSize));

  const reservations = useMemo(() => {
    const sorted = [...rawReservations].sort((a, b) => {
      const pa = getPriority(a.date, a.timeSlot);
      const pb = getPriority(b.date, b.timeSlot);
      if (pa.sort !== pb.sort) return pa.sort - pb.sort;
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.timeSlot.localeCompare(b.timeSlot);
    });
    return sorted;
  }, [rawReservations]);

  const handleStatusChange = (s: string) => {
    setStatus(s === "All" ? "All" : s);
    setPage(1);
  };

  const handleBranchChange = (id: number | undefined) => {
    setBranchId(id);
    setPage(1);
  };

  const setPageNum = (p: number) => {
    setPage(p);
  };

  const setPageSizeNum = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const handlePresetChange = (p: DatePreset) => {
    if (p !== "custom") {
      setPreset(p);
      setCustomFrom("");
      setCustomTo("");
    } else {
      setPreset(p);
    }
    setPage(1);
  };

  const handleCustomFromChange = (val: string) => {
    setCustomFrom(val);
    setPage(1);
  };

  const handleCustomToChange = (val: string) => {
    setCustomTo(val);
    setPage(1);
  };

  const handle = async (id: number, s: string) => {
    try {
      await updateStatus.mutateAsync({ id, status: s });
      toast.success(`Reservation #${id} → ${s}`);
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Failed.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold">Reservations</h1>
          {!isLoading && (
            <p className="text-sm text-muted-foreground mt-0.5">{totalReservations.toLocaleString()} total</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search reservations…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-8 w-52 text-sm"
              data-tagid="input-reservations-search"
            />
          </div>
          <Select
            value={branchId?.toString() ?? "__all"}
            onValueChange={v => handleBranchChange(v === "__all" ? undefined : Number(v))}
          >
            <SelectTrigger className="h-8 w-48 text-xs"><SelectValue placeholder="All branches" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all" className="text-xs">All branches</SelectItem>
              {branches.map(b => (
                <SelectItem key={b.id} value={String(b.id)} className="text-xs">{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="h-8 text-xs" data-tagid="button-reservations-refresh">
            Refresh
          </Button>
        </div>
      </div>

      {/* Date preset filter */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1">
          {PRESET_LABELS.map(p => (
            <button
              key={p.key}
              onClick={() => handlePresetChange(p.key)}
              className={`h-8 rounded-lg border px-3 text-xs font-medium transition ${
                preset === p.key
                  ? "gradient-primary border-transparent text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
              data-tagid={`button-reservations-preset-${p.key}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {preset === "custom" && (
          <div className="flex flex-wrap items-center gap-1.5">
            <label className="text-xs text-muted-foreground">From</label>
            <input
              type="date" value={customFrom} max={customTo || undefined}
              onChange={e => handleCustomFromChange(e.target.value)}
              className="h-8 rounded-lg border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              data-tagid="input-reservations-date-from"
            />
            <label className="text-xs text-muted-foreground">To</label>
            <input
              type="date" value={customTo} min={customFrom || undefined}
              onChange={e => handleCustomToChange(e.target.value)}
              className="h-8 rounded-lg border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              data-tagid="input-reservations-date-to"
            />
          </div>
        )}
      </div>

      {/* Status tabs */}
      <div className="overflow-x-auto pb-1 -mx-1 px-1">
        <div className="inline-flex items-center rounded-lg bg-muted p-1 gap-0.5 min-w-max">
          {STATUS_TABS.map(t => {
            const isActive = status === t || (t === "All" && !status);
            const hex = STATUS_HEX[t];
            return (
              <button
                key={t}
                onClick={() => handleStatusChange(t)}
                data-tagid={`button-reservations-tab-${t}`}
                className={[
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap",
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
                ].join(" ")}
              >
                {hex && (
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: isActive ? hex : hexToRgba(hex, 0.5) }}
                  />
                )}
                {t}
                {isActive && !isLoading && (
                  <span className="inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold min-w-[18px] bg-primary/10 text-primary">
                    {reservations.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading reservations…
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-sm text-destructive">
            Failed to load reservations: {error?.message ?? "Unknown error"}
          </div>
        ) : reservations.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No reservations{status !== "All" && status ? ` with status "${status}"` : ""}.
          </div>
        ) : (
          <div className="divide-y">
            {/* Column headers */}
            <div className="flex items-center gap-3 px-4 py-2.5 bg-muted/50 border-l-4 border-l-transparent">
              <div className="w-[80px] shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">#</div>
              <div className="flex-1 min-w-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Guest</div>
              <div className="hidden lg:block w-[120px] shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Branch</div>
              <div className="hidden sm:block w-[130px] shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Reservation Time</div>
              <div className="hidden md:block w-[60px] shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground text-center">Guests</div>
              <div className="w-[110px] shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Status</div>
              <div className="hidden lg:block w-[130px] shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Created</div>
              <div className="w-4 shrink-0" />
            </div>

            {reservations.map(r => {
              const priority   = getPriority(r.date, r.timeSlot);
              const hex        = STATUS_HEX[r.status] ?? "#6b7280";
              const isExpanded = expandedId === r.id;
              const notTerminal = r.status !== "Cancelled";
              const showPriority = (priority.level === "asap" || priority.level === "urgent") && notTerminal;

              return (
                <div key={r.id}>
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : r.id)}
                    className="flex items-center gap-3 px-4 py-3.5 cursor-pointer select-none transition-colors border-l-4 hover:bg-muted/30"
                    style={{ borderLeftColor: hex }}
                  >
                    {/* # + priority */}
                    <div className="w-[80px] shrink-0">
                      <div className="font-mono text-lg font-bold leading-tight text-primary">#{r.id}</div>
                      {showPriority && (
                        <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold mt-0.5 ${priority.badge}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${priority.dot}`} />
                          {priority.label}
                        </span>
                      )}
                    </div>

                    {/* Guest */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{r.contactName}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                        {r.isLinkedToAccount && (
                          <span className="rounded-full bg-blue-100 text-blue-700 px-1.5 py-0.5 text-[10px] font-semibold shrink-0">Member</span>
                        )}
                        <span className="truncate lg:hidden">{r.branchName.replace("Hind Indisk ", "")}</span>
                      </div>
                    </div>

                    {/* Branch (wider screens) */}
                    <div className="hidden lg:block w-[120px] shrink-0 text-sm text-muted-foreground truncate">
                      {r.branchName.replace("Hind Indisk ", "")}
                    </div>

                    {/* Reservation Time */}
                    <div className="hidden sm:flex flex-col w-[130px] shrink-0">
                      <span className="text-xs font-medium tabular-nums">{formatDateStr(r.date)}</span>
                      <span className="text-[11px] text-muted-foreground tabular-nums">{formatTimeStr(r.timeSlot)}</span>
                    </div>

                    {/* Guests */}
                    <div className="hidden md:block w-[60px] shrink-0 text-center">
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700 tabular-nums">
                        {r.guestCount}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="w-[110px] shrink-0">
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={{ backgroundColor: hexToRgba(hex, 0.12), color: hex }}
                      >
                        {r.status}
                      </span>
                    </div>

                    {/* Created */}
                    <div className="hidden lg:flex flex-col w-[130px] shrink-0 text-xs text-muted-foreground tabular-nums">
                      <span>{formatDate(r.createdAt)}</span>
                      <span className="text-[11px]">{formatTime(r.createdAt)}</span>
                    </div>

                    <ChevronRight className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                  </div>

                  {isExpanded && (
                    <div className="px-6 py-4 bg-muted/10 border-l-4" style={{ borderLeftColor: hex }}>
                      <ReservationExpandedRow
                        r={r}
                        onStatus={handle}
                        isUpdating={updateStatus.isPending}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Rows per page</span>
            <Select
              value={String(pageSize)}
              onValueChange={v => setPageSizeNum(Number(v))}
            >
              <SelectTrigger className="h-7 w-16 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map(n => (
                  <SelectItem key={n} value={String(n)} className="text-xs">{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>{totalReservations.toLocaleString()} total</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="mr-2">Page {page} of {totalPages}</span>
            <Button size="sm" variant="outline" className="h-7 w-7 p-0" data-tagid="button-reservations-first-page"
              onClick={() => setPageNum(1)} disabled={page <= 1}>
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="outline" className="h-7 w-7 p-0" data-tagid="button-reservations-prev-page"
              onClick={() => setPageNum(page - 1)} disabled={page <= 1}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="outline" className="h-7 w-7 p-0" data-tagid="button-reservations-next-page"
              onClick={() => setPageNum(page + 1)} disabled={page >= totalPages}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="outline" className="h-7 w-7 p-0" data-tagid="button-reservations-last-page"
              onClick={() => setPageNum(totalPages)} disabled={page >= totalPages}>
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
