import { createFileRoute } from "@tanstack/react-router";
import { nowInDenmark, todayInDenmark } from "@/lib/denmarkTime";
import { formatDateTime, formatDateStr, formatTimeStr } from "@/lib/dateFormat";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  useServiceStatus,
  useServiceClosureHistory,
  useToggleServiceStatus,
  type BranchServiceClosureDto,
  type ServiceClosureFilters,
  type ServiceType,
} from "@/hooks/useServiceStatus";
import { useUpdateBranch, type AdminBranchDto, type UpdateBranchInput } from "@/hooks/useUpdateBranch";
import { useSchedule, useUpsertSchedule, type DayScheduleDto } from "@/hooks/useSchedule";
import {
  useClosures, useAllClosures, useCreateClosure, useDeleteClosure, useDeleteClosureById,
  type ClosureDto, type ClosureScope, type CreateClosureInput,
} from "@/hooks/useClosures";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Check, Store, CalendarOff, Repeat, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/settings")({ component: ServiceStatusPage });

// ── schedule helpers (shared with branch edit page) ───────────────────────────

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type ScheduleRow = {
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  slotIntervalMinutes: number;
  maxOrdersPerSlot: number;
  maxReservationsPerSlot: number;
};

function buildDefaultRows(data: DayScheduleDto[]): ScheduleRow[] {
  return DAY_NAMES.map((_, day) => {
    const existing = data.find(d => d.dayOfWeek === day);
    return existing
      ? { ...existing, dayOfWeek: day, isOpen: true }
      : { dayOfWeek: day, isOpen: false, openTime: "11:00", closeTime: "22:00",
          slotIntervalMinutes: 30, maxOrdersPerSlot: 10, maxReservationsPerSlot: 5 };
  });
}

function branchPayload(b: AdminBranchDto): UpdateBranchInput & { id: number } {
  return {
    id: b.id,
    name: b.name, addressLine1: b.addressLine1, addressLine2: b.addressLine2,
    city: b.city, postalCode: b.postalCode, country: b.country,
    phone: b.phone, email: b.email, googleMapsLink: b.googleMapsLink,
    imageUrl: b.imageUrl, rating: b.rating, reviewCount: b.reviewCount,
    deliveryFee: b.deliveryFee, deliveryFeeEnabled: b.deliveryFeeEnabled,
    maxAdvanceDays: b.maxAdvanceDays,
  };
}

// ── Service Controls (Orders / Reservations toggle) ───────────────────────────

function ToggleButton({ label, isClosed, loading = false, disabled, onToggle }: {
  label: string; isClosed: boolean; loading?: boolean; disabled?: boolean; onToggle: () => void;
}) {
  return (
    <button onClick={onToggle} disabled={loading || disabled}
      className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed ${
        disabled
          ? "bg-gray-100 text-gray-400 border-gray-200"
          : isClosed
            ? "bg-red-100 text-red-700 border-red-200 hover:bg-red-200"
            : "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
      }`}>
      <span className={`w-2 h-2 rounded-full ${disabled ? "bg-gray-300" : isClosed ? "bg-red-500" : "bg-green-500"}`} />
      {label ? `${label}: ` : ""}{isClosed ? "Closed" : "Open"}
    </button>
  );
}

// StatusPanel / OrderTypesPanel tables were replaced by per-branch controls
// rendered inline in AvailabilityClosuresPanel (driven by its Branch dropdown).

// ── Shared branch picker ──────────────────────────────────────────────────────

const BRANCH_ALL = "__all__";

function BranchPicker({ branches, value, onChange, allLabel, hideLabel }: {
  branches: AdminBranchDto[];
  value: number | undefined;
  onChange: (id: number | undefined) => void;
  allLabel?: string;
  hideLabel?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      {!hideLabel && <Label className="text-xs font-medium text-muted-foreground">Branch</Label>}
      <Select
        value={value !== undefined ? String(value) : BRANCH_ALL}
        onValueChange={v => onChange(v !== BRANCH_ALL ? Number(v) : undefined)}
      >
        <SelectTrigger className="w-full sm:w-72">
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Select a branch" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {allLabel && <SelectItem value={BRANCH_ALL}>{allLabel}</SelectItem>}
          {branches.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

// ── Delivery Fee / Pricing + Advance Booking ──────────────────────────────────

function PricingBookingPanel({ branches }: { branches: AdminBranchDto[] }) {
  const qc = useQueryClient();
  const update = useUpdateBranch();
  const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>(branches[0]?.id);
  const branch = branches.find(b => b.id === selectedBranchId);
  const [fee, setFee]   = useState("");
  const [days, setDays] = useState("");

  useEffect(() => {
    if (branch) { setFee(String(branch.deliveryFee)); setDays(String(branch.maxAdvanceDays)); }
  }, [branch]);

  const save = (patch: Partial<UpdateBranchInput>, msg: string) => {
    if (!branch) return;
    update.mutate({ ...branchPayload(branch), ...patch }, {
      onSuccess: () => { toast.success(msg); qc.invalidateQueries({ queryKey: ["service-status"] }); },
      onError:   () => toast.error("Failed to update"),
    });
  };

  return (
    <div className="space-y-4">
      <BranchPicker branches={branches} value={selectedBranchId} onChange={setSelectedBranchId} />

      {branch && (
        <div className="grid gap-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:grid-cols-2">
          {/* Delivery Fee / Pricing */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">Delivery Fee / Pricing</h3>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Delivery Fee (DKK)</Label>
              <div className="flex items-center gap-2">
                <Input type="number" min={0} step={1} value={fee}
                  onChange={e => setFee(e.target.value)}
                  className="h-9 w-32" disabled={!branch.deliveryFeeEnabled} />
                <Button size="sm" variant="secondary"
                  onClick={() => save({ deliveryFee: parseFloat(fee) || 0 }, "Pricing updated")}
                  disabled={update.isPending || !branch.deliveryFeeEnabled}>
                  Save
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Switch checked={branch.deliveryFeeEnabled} disabled={update.isPending}
                onCheckedChange={v => save({ deliveryFeeEnabled: v }, "Pricing updated")} />
              <span className={`text-xs font-medium ${branch.deliveryFeeEnabled ? "text-green-700" : "text-gray-400"}`}>
                Delivery fee {branch.deliveryFeeEnabled ? "enabled" : "disabled"}
              </span>
            </div>
          </div>

          {/* Advance Booking */}
          <div className="space-y-4 sm:border-l sm:border-gray-100 sm:pl-6">
            <h3 className="text-sm font-semibold text-gray-800">Advance Booking</h3>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Max Advance Days</Label>
              <div className="flex items-center gap-2">
                <Input type="number" min={0} max={90} value={days}
                  onChange={e => setDays(e.target.value)} className="h-9 w-24" />
                <span className="text-xs text-gray-500">days ahead</span>
                <Button size="sm" variant="secondary"
                  onClick={() => save({ maxAdvanceDays: parseInt(days) || 0 }, "Advance booking updated")}
                  disabled={update.isPending}>
                  Save
                </Button>
              </div>
              <p className="text-xs text-gray-400">0 = today only</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Weekly Schedule ───────────────────────────────────────────────────────────

function WeeklySchedulePanel({ branches }: { branches: AdminBranchDto[] }) {
  const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>(branches[0]?.id);
  const { data: scheduleData, isLoading } = useSchedule(selectedBranchId ?? 0);
  const upsertSchedule = useUpsertSchedule(selectedBranchId ?? 0);
  const [rows, setRows] = useState<ScheduleRow[]>(() => buildDefaultRows([]));

  useEffect(() => {
    setRows(buildDefaultRows(scheduleData ?? []));
  }, [scheduleData, selectedBranchId]);

  const updateRow = (day: number, patch: Partial<ScheduleRow>) =>
    setRows(prev => prev.map(r => r.dayOfWeek === day ? { ...r, ...patch } : r));

  const handleSave = async () => {
    const openDays = rows.filter(r => r.isOpen).map(
      ({ dayOfWeek, openTime, closeTime, slotIntervalMinutes, maxOrdersPerSlot, maxReservationsPerSlot }) => ({
        dayOfWeek, openTime, closeTime, slotIntervalMinutes, maxOrdersPerSlot, maxReservationsPerSlot,
      })
    );
    try {
      await upsertSchedule.mutateAsync(openDays);
      toast.success("Schedule saved");
    } catch (e) { toast.error((e as Error).message || "Failed to save schedule"); }
  };

  return (
    <div className="space-y-4">
      <BranchPicker branches={branches} value={selectedBranchId} onChange={setSelectedBranchId} />

      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-500 text-sm py-6">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading schedule…
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border bg-white">
            <div className="divide-y min-w-[620px]">
            {rows.map(row => (
              <div key={row.dayOfWeek}
                className={`grid grid-cols-[140px_1fr] gap-4 p-4 items-start ${!row.isOpen ? "opacity-50" : ""}`}>

                <div className="flex items-center gap-3 pt-1">
                  <Switch checked={row.isOpen} onCheckedChange={v => updateRow(row.dayOfWeek, { isOpen: v })} />
                  <span className="text-sm font-medium">{DAY_NAMES[row.dayOfWeek]}</span>
                </div>

                {row.isOpen ? (
                  <div className="grid grid-cols-5 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Open</Label>
                      <Input type="time" value={row.openTime}
                        onChange={e => updateRow(row.dayOfWeek, { openTime: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Close</Label>
                      <Input type="time" value={row.closeTime}
                        onChange={e => updateRow(row.dayOfWeek, { closeTime: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Slot every (min)</Label>
                      <Input type="number" min={15} max={120} step={15} value={row.slotIntervalMinutes}
                        onChange={e => updateRow(row.dayOfWeek, { slotIntervalMinutes: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Max orders/slot</Label>
                      <Input type="number" min={1} value={row.maxOrdersPerSlot}
                        onChange={e => updateRow(row.dayOfWeek, { maxOrdersPerSlot: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Max reservations/slot</Label>
                      <Input type="number" min={1} value={row.maxReservationsPerSlot}
                        onChange={e => updateRow(row.dayOfWeek, { maxReservationsPerSlot: Number(e.target.value) })} />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground pt-1">Closed</p>
                )}
              </div>
            ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button className="gradient-primary text-primary-foreground" onClick={handleSave} disabled={upsertSchedule.isPending}>
              {upsertSchedule.isPending
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
                : <><Check className="mr-1.5 h-4 w-4" />Save Schedule</>}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Date-Specific Closures ────────────────────────────────────────────────────

type ServiceKey = "Reservation" | "Pickup" | "Delivery";
const SERVICE_KEYS: ServiceKey[] = ["Reservation", "Pickup", "Delivery"];

const BRANCH_ROW_BG = [
  "bg-blue-50", "bg-amber-50", "bg-emerald-50", "bg-violet-50",
  "bg-rose-50",  "bg-teal-50",  "bg-orange-50",  "bg-indigo-50",
];
const SERVICE_LABEL: Record<ServiceKey, string> = {
  Reservation: "Reservation",
  Pickup:      "Order — Pickup",
  Delivery:    "Order — Delivery",
};
const SCOPE_LABEL: Record<ClosureScope, string> = {
  Restaurant:  "Whole restaurant",
  Reservation: "Reservation",
  Pickup:      "Order - Pickup",
  Delivery:    "Order - Delivery",
};

function PanelBranchHeader({ branches, value, onChange }: {
  branches: AdminBranchDto[]; value: number; onChange: (id: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50/60 px-4 py-3">
      <Store className="h-4 w-4 shrink-0 text-muted-foreground" />
      <Select value={String(value)} onValueChange={v => onChange(Number(v))}>
        <SelectTrigger className="h-8 w-full sm:w-64 font-medium">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {branches.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function AvailabilityClosuresPanel({ branches }: { branches: AdminBranchDto[] }) {
  const qc = useQueryClient();
  const [instantBranchId, setInstantBranchId]   = useState<number | undefined>(branches[0]?.id);
  const [scheduleBranchId, setScheduleBranchId] = useState<number | undefined>(branches[0]?.id);
  const [listBranchId, setListBranchId]         = useState<number | undefined>(undefined);
  const instantBranch = branches.find(b => b.id === instantBranchId);
  const createClosure = useCreateClosure(scheduleBranchId ?? 0);
  const allBranchIds = branches.map(b => b.id);
  const { data: allBranchClosures, isLoading: isAllLoading } = useAllClosures(allBranchIds);
  const { data: singleBranchClosures = [], isLoading: isSingleLoading } = useClosures(listBranchId ?? 0);
  const closures  = listBranchId !== undefined ? singleBranchClosures : allBranchClosures;
  const isLoading = listBranchId !== undefined ? isSingleLoading      : isAllLoading;
  const deleteClosureById = useDeleteClosureById();
  const toggleService = useToggleServiceStatus();
  const updateBranch  = useUpdateBranch();

  const today = todayInDenmark();
  const todayDow = nowInDenmark().getDay(); // 0=Sunday..6=Saturday
  const tomorrow = (() => {
    const d = new Date(today + "T12:00:00");
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  })();

  // Schedule for the instant-closure branch — used to default the time range
  const { data: scheduleData, isLoading: isScheduleLoading } = useSchedule(instantBranchId ?? 0);
  const todaySchedule = scheduleData?.find(s => s.dayOfWeek === todayDow);
  const noScheduleToday = !!instantBranchId && !isScheduleLoading && !todaySchedule;

  type TimeRange = { from: string; to: string };
  const [instantTimes, setInstantTimes] = useState<Record<ServiceKey, TimeRange>>({
    Reservation: { from: "00:00", to: "23:59" },
    Delivery:    { from: "00:00", to: "23:59" },
    Pickup:      { from: "00:00", to: "23:59" },
  });

  useEffect(() => {
    const def = { from: todaySchedule?.openTime ?? "00:00", to: todaySchedule?.closeTime ?? "23:59" };
    setInstantTimes({ Reservation: { from: "00:00", to: "23:59" }, Delivery: def, Pickup: def });
  }, [instantBranchId, todaySchedule?.openTime, todaySchedule?.closeTime]);

  const [instantNotes, setInstantNotes] = useState<Record<ServiceKey, string>>({ Reservation: "", Delivery: "", Pickup: "" });

  // Instant Delivery/Pickup closes are stored as today-dated closures on the branch
  const { data: instantClosures = [] } = useClosures(instantBranchId ?? 0);
  const createInstant = useCreateClosure(instantBranchId ?? 0);
  const deleteInstant = useDeleteClosure(instantBranchId ?? 0);

  const instantNoteFor = (s: ServiceKey) => instantNotes[s].trim() || undefined;

  const instantOrderClosure = (scope: "Delivery" | "Pickup") =>
    instantClosures.find(c => c.closureType === "DateRange" && c.scope === scope
      && (c.startDate ?? "") <= today && (c.endDate ?? c.startDate ?? "") >= today);

  // Stable booleans derived from server state — used as effect deps to avoid array-reference churn
  const serverResClosed  = instantBranch?.isCloseReservation ?? false;
  const serverDelClosed  = !!instantOrderClosure("Delivery");
  const serverPickClosed = !!instantOrderClosure("Pickup");

  const serverClosed: Record<ServiceKey, boolean> = {
    Reservation: serverResClosed,
    Delivery:    serverDelClosed,
    Pickup:      serverPickClosed,
  };

  // Local toggle state — only applied on Save
  const [localClosed, setLocalClosed] = useState<Record<ServiceKey, boolean>>({ Reservation: false, Delivery: false, Pickup: false });

  useEffect(() => {
    setLocalClosed({ Reservation: serverResClosed, Delivery: serverDelClosed, Pickup: serverPickClosed });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instantBranchId, serverResClosed, serverDelClosed, serverPickClosed]);

  // Active scheduled closure check — disables Instant Closure toggle for affected services
  // Today-only (startDate=today, endDate=today) closures are instant closures and are excluded here
  const nowStr = nowInDenmark().toTimeString().slice(0, 5);
  const isActiveNow = (scope: ServiceKey): boolean =>
    instantClosures.some(c => {
      if (c.scope !== scope || c.closureType !== "DateRange") return false;
      const s = c.startDate ?? "", e = c.endDate ?? s;
      if (today < s || today > e) return false;
      if (s === today && e === today) return false; // instant closures, not scheduled
      if (c.startTime && c.endTime) return nowStr >= c.startTime && nowStr <= c.endTime;
      return true;
    });
  const scheduledActive: Record<ServiceKey, boolean> = {
    Reservation: isActiveNow("Reservation"),
    Delivery:    isActiveNow("Delivery"),
    Pickup:      isActiveNow("Pickup"),
  };

  const isDirty = SERVICE_KEYS.some(s => localClosed[s] !== serverClosed[s]);
  const isSaving = toggleService.isPending || createInstant.isPending || deleteInstant.isPending;

  const handleSave = async () => {
    if (!instantBranchId) return;
    const toClose = SERVICE_KEYS.filter(s => localClosed[s] && !serverClosed[s]);
    const toOpen  = SERVICE_KEYS.filter(s => !localClosed[s] && serverClosed[s]);
    if (toClose.length === 0 && toOpen.length === 0) return;

    try {
      for (const s of toClose) {
        const t = instantTimes[s];
        const hasTime = !!(t.from && t.to);
        // All three services store a BranchClosure for the time range (enables auto-reopen)
        await createInstant.mutateAsync({
          scope: s as "Reservation" | "Delivery" | "Pickup",
          closureType: "DateRange", startDate: today, endDate: today,
          startTime: hasTime ? t.from : undefined,
          endTime:   hasTime ? t.to   : undefined,
          note: instantNoteFor(s),
        });
        await toggleService.mutateAsync({ branchId: instantBranchId, serviceType: s, isClosed: true, note: instantNoteFor(s) });
      }
      for (const s of toOpen) {
        // Delete ALL active-today BranchClosures for this scope
        const allExisting = instantClosures.filter(c =>
          c.closureType === "DateRange" && c.scope === s
          && (c.startDate ?? "") <= today && (c.endDate ?? c.startDate ?? "") >= today
        );
        for (const ex of allExisting) {
          await deleteInstant.mutateAsync(ex.id);
        }
        await toggleService.mutateAsync({ branchId: instantBranchId, serviceType: s, isClosed: false });
      }
      const closedNames = toClose.map(s => SERVICE_LABEL[s]).join(", ");
      const openedNames = toOpen.map(s => SERVICE_LABEL[s]).join(", ");
      toast.success([closedNames && `${closedNames} closed`, openedNames && `${openedNames} reopened`].filter(Boolean).join(" · "));
    } catch (e) { toast.error((e as Error).message || "Failed to save"); }
  };

  // Auto-reopen when the To time passes for any time-bounded instant closure
  useEffect(() => {
    if (!instantBranchId) return;
    const reopen = async () => {
      const now = nowInDenmark().toTimeString().slice(0, 5);
      for (const scope of ["Reservation", "Delivery", "Pickup"] as const) {
        const expired = instantClosures.filter(c =>
          c.closureType === "DateRange" && c.scope === scope
          && (c.startDate ?? "") <= today && (c.endDate ?? c.startDate ?? "") >= today
          && c.endTime !== null && now >= c.endTime!
        );
        if (expired.length === 0) continue;
        try {
          for (const ex of expired) await deleteInstant.mutateAsync(ex.id);
          await toggleService.mutateAsync({ branchId: instantBranchId, serviceType: scope, isClosed: false });
        } catch { /* retry on next tick */ }
      }
    };
    const id = setInterval(reopen, 60_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instantBranchId, today, instantClosures.length]);

  type FutureRow = { closed: boolean; startDate: string; startTime: string; endDate: string; endTime: string; note: string; };
  const defaultFutureRow = (): FutureRow => ({ closed: false, startDate: tomorrow, startTime: "00:00", endDate: tomorrow, endTime: "23:59", note: "" });
  const [futureRows, setFutureRows] = useState<Record<ServiceKey, FutureRow>>({
    Reservation: defaultFutureRow(),
    Pickup:      defaultFutureRow(),
    Delivery:    defaultFutureRow(),
  });
  const updateFuture = (s: ServiceKey, patch: Partial<FutureRow>) =>
    setFutureRows(prev => ({ ...prev, [s]: { ...prev[s], ...patch } }));

  const handleAdd = async () => {
    const toAdd = SERVICE_KEYS.filter(s => futureRows[s].closed);
    if (toAdd.length === 0) { toast.error("Select at least one service."); return; }
    for (const s of toAdd) {
      if (futureRows[s].startDate <= today) {
        toast.error(`${SERVICE_LABEL[s]}: Start date must be tomorrow or later.`); return;
      }
      if (futureRows[s].endDate < futureRows[s].startDate) {
        toast.error(`${SERVICE_LABEL[s]}: End date cannot be before start date.`); return;
      }
    }
    try {
      for (const s of toAdd) {
        const row = futureRows[s];
        const hasTime = !!(row.startTime && row.endTime);
        await createClosure.mutateAsync({
          scope: s, closureType: "DateRange",
          startDate: row.startDate, endDate: row.endDate,
          startTime: hasTime ? row.startTime : undefined,
          endTime:   hasTime ? row.endTime   : undefined,
          note: row.note.trim() || undefined,
        });
      }
      toast.success(toAdd.length > 1 ? "Closures added." : "Closure added.");
      setFutureRows({ Reservation: defaultFutureRow(), Pickup: defaultFutureRow(), Delivery: defaultFutureRow() });
    } catch (e) { toast.error((e as Error).message || "Failed to add closure."); }
  };

  const handleDelete = async (c: ClosureDto) => {
    try {
      await deleteClosureById.mutateAsync({ branchId: c.branchId, closureId: c.id });
      // If this closure was active today, stamp the service history as reopened
      const isToday = c.closureType === "Weekly"
        ? c.dayOfWeek === todayDow
        : (c.startDate ?? "") <= today && today <= (c.endDate ?? c.startDate ?? "");
      if (isToday && (c.scope === "Delivery" || c.scope === "Pickup" || c.scope === "Reservation")) {
        toggleService.mutate({ branchId: c.branchId, serviceType: c.scope as ServiceType, isClosed: false });
      }
      toast.success("Closure removed.");
    } catch (e) { toast.error((e as Error).message || "Failed to remove closure."); }
  };

  // ── Scheduled list filters (client-side) ──
  const [showPast, setShowPast]               = useState(false);
  const [listFrom, setListFrom]               = useState("");
  const [listTo, setListTo]                   = useState("");
  const [listSearch, setListSearch]           = useState("");
  const [listServiceType, setListServiceType] = useState("");
  const [listPage, setListPage]               = useState(1);
  const LIST_PAGE_SIZE = 20;

  const visibleClosures = closures.filter(c => {
    if (listServiceType && c.scope !== listServiceType) return false;
    if (c.closureType === "Weekly") {
      if (listSearch) {
        const q = listSearch.toLowerCase();
        return SCOPE_LABEL[c.scope].toLowerCase().includes(q) || !!c.note?.toLowerCase().includes(q) || DAY_NAMES[c.dayOfWeek ?? 0].toLowerCase().includes(q);
      }
      return true;
    }
    const start = c.startDate ?? "";
    const end   = c.endDate ?? start;
    if (start <= today && end <= today) return false; // always hide instant (today-only) closures
    if (!showPast && end < today) return false;
    if (listFrom && end < listFrom) return false;
    if (listTo && start > listTo) return false;
    if (listSearch) {
      const q = listSearch.toLowerCase();
      if (!SCOPE_LABEL[c.scope].toLowerCase().includes(q) && !c.note?.toLowerCase().includes(q) && !start.includes(q) && !end.includes(q)) return false;
    }
    return true;
  });

  const listFiltersActive = showPast || !!listFrom || !!listTo || !!listSearch || !!listServiceType;
  const listPageCount = Math.ceil(visibleClosures.length / LIST_PAGE_SIZE);
  const pagedClosures = visibleClosures.slice((listPage - 1) * LIST_PAGE_SIZE, listPage * LIST_PAGE_SIZE);

  useEffect(() => { setListPage(1); }, [listSearch, listServiceType, showPast, listFrom, listTo, listBranchId]);

  if (branches.length === 0)
    return <p className="text-gray-400 text-sm">No branches found.</p>;

  return (
    <div className="space-y-8">
      {/* ═══ 1. Instant Closure (Only for today) ═══ */}
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Instant Closure <span className="text-sm font-normal text-gray-500">(Only for today)</span>
          </h2>
          <p className="text-xs text-gray-500">Close acceptance right now — stays closed until you reopen.</p>
        </div>

        <BranchPicker branches={branches} value={instantBranchId} onChange={setInstantBranchId} />
        {instantBranch && (
          <>
            {noScheduleToday && (
              <p className="text-xs text-amber-600">No schedule for today — service controls are disabled.</p>
            )}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-100">
              {SERVICE_KEYS.map(s => {
                const t         = instantTimes[s];
                const isBlocked = scheduledActive[s];
                return (
                  <div key={s} className={`p-3 space-y-2 transition-opacity ${isBlocked ? "opacity-50" : ""}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-gray-700 w-36 shrink-0">{SERVICE_LABEL[s]}</span>
                      <ToggleButton label="" isClosed={localClosed[s]}
                        disabled={noScheduleToday || isBlocked}
                        onToggle={() => setLocalClosed(prev => ({ ...prev, [s]: !prev[s] }))} />
                      {isBlocked && (
                        <span className="text-xs text-amber-600 font-medium">Closed by schedule</span>
                      )}
                      {!isBlocked && localClosed[s] && (
                        <>
                          <span className="text-xs text-muted-foreground">From</span>
                          <Input type="time" value={t.from} className="h-8 w-28 text-sm"
                            onChange={e => setInstantTimes(prev => ({ ...prev, [s]: { ...prev[s], from: e.target.value } }))} />
                          <span className="text-xs text-muted-foreground">→ To</span>
                          <Input type="time" value={t.to} className="h-8 w-28 text-sm"
                            onChange={e => setInstantTimes(prev => ({ ...prev, [s]: { ...prev[s], to: e.target.value } }))} />
                        </>
                      )}
                    </div>
                    <Input value={instantNotes[s]} maxLength={200} placeholder="Closing note (optional)"
                      className="h-8 text-sm" disabled={isBlocked}
                      onChange={e => setInstantNotes(prev => ({ ...prev, [s]: e.target.value }))} />
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setLocalClosed({ ...serverClosed })}
                disabled={!isDirty || isSaving}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={!isDirty || isSaving}
                className="px-4 py-1.5 text-sm font-medium rounded-lg bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed">
                {isSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </>
        )}
      </section>

      {/* ═══ 2. Future Closure ═══ */}
      <section className="space-y-3 border-t border-gray-200 pt-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Future Closure</h2>
          <p className="text-xs text-gray-500">Schedule a closure for specific future dates.</p>
        </div>

        <BranchPicker branches={branches} value={scheduleBranchId} onChange={setScheduleBranchId} />
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-100">
          {SERVICE_KEYS.map(s => {
            const row = futureRows[s];
            return (
              <div key={s} className={`p-3 space-y-2 transition-opacity ${!row.closed ? "opacity-60" : ""}`}>
                {/* Service checkbox + label */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={row.closed}
                    onCheckedChange={v => updateFuture(s, { closed: v === true })} />
                  <span className="text-sm font-semibold text-gray-700">{SERVICE_LABEL[s]}</span>
                </label>

                {/* From / To — 2-col grid that stacks on mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">From</Label>
                    <div className="flex gap-2">
                      <Input type="date" min={tomorrow} value={row.startDate} disabled={!row.closed}
                        className="h-8 w-36 text-sm"
                        onChange={e => { const d = e.target.value; updateFuture(s, { startDate: d, endDate: d > row.endDate ? d : row.endDate }); }} />
                      <Input type="time" value={row.startTime} disabled={!row.closed}
                        className="h-8 w-28 shrink-0 text-sm"
                        onChange={e => updateFuture(s, { startTime: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">To</Label>
                    <div className="flex gap-2">
                      <Input type="date" min={row.startDate} value={row.endDate} disabled={!row.closed}
                        className="h-8 w-36 text-sm"
                        onChange={e => updateFuture(s, { endDate: e.target.value })} />
                      <Input type="time" value={row.endTime} disabled={!row.closed}
                        className="h-8 w-28 shrink-0 text-sm"
                        onChange={e => updateFuture(s, { endTime: e.target.value })} />
                    </div>
                  </div>
                </div>

                <Input value={row.note} maxLength={200} placeholder="Closing note (optional)"
                  className="h-8 text-sm" disabled={!row.closed}
                  onChange={e => updateFuture(s, { note: e.target.value })} />
              </div>
            );
          })}
        </div>

        <div className="flex justify-end">
          <Button className="gradient-primary text-primary-foreground"
            onClick={handleAdd} disabled={createClosure.isPending}>
            {createClosure.isPending
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <Plus className="mr-1.5 h-4 w-4" />}
            Add closure
          </Button>
        </div>
      </section>

      {/* ═══ 3. Scheduled closures list ═══ */}
      <section className="space-y-4 border-t border-gray-200 pt-6">
        <h2 className="text-lg font-semibold text-gray-900">Scheduled closures</h2>

        {/* Filter bar */}
        <div className="overflow-x-auto no-scrollbar">
          <div className="flex gap-2 items-center min-w-max">
            <input type="text" placeholder="Search..." value={listSearch}
              onChange={e => setListSearch(e.target.value)}
              className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-amber-400" />
            <BranchPicker branches={branches} value={listBranchId} onChange={setListBranchId} allLabel="All Branches" hideLabel />
            <select value={listServiceType}
              onChange={e => setListServiceType(e.target.value)}
              className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
              <option value="">All Service</option>
              <option value="Reservation">Reservation</option>
              <option value="Delivery">Order - Delivery</option>
              <option value="Pickup">Order - Pickup</option>
              <option value="Restaurant">Whole restaurant</option>
            </select>
            <input type="date" value={listFrom}
              onChange={e => setListFrom(e.target.value)}
              className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
            <span className="text-gray-400 text-sm shrink-0">to</span>
            <input type="date" value={listTo}
              onChange={e => setListTo(e.target.value)}
              className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
            <label className="flex items-center gap-1.5 text-sm cursor-pointer shrink-0">
              <Checkbox checked={showPast} onCheckedChange={v => setShowPast(v === true)} />
              Show past
            </label>
            {listFiltersActive && (
              <button onClick={() => { setShowPast(false); setListFrom(""); setListTo(""); setListSearch(""); setListServiceType(""); }}
                className="text-sm text-gray-500 hover:text-gray-800 underline shrink-0">
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground p-6 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {listBranchId === undefined && <th className="px-5 py-3 text-left font-semibold text-gray-700">Branch</th>}
                  <th className="px-5 py-3 text-left font-semibold text-gray-700">Service</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-700">Type</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-700">Start From</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-700">End To</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-700">Note</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {pagedClosures.length === 0 && (
                  <tr><td colSpan={listBranchId === undefined ? 7 : 6} className="px-5 py-10 text-center text-gray-400">
                    {closures.length === 0 ? "No closures scheduled." : "No closures match the filters."}
                  </td></tr>
                )}
                {pagedClosures.map(c => (
                  <tr key={c.id} className={BRANCH_ROW_BG[branches.findIndex(b => b.id === c.branchId) % BRANCH_ROW_BG.length] ?? "bg-white"}>
                    {listBranchId === undefined && (
                      <td className="px-5 py-3 font-medium text-gray-700">
                        {branches.find(b => b.id === c.branchId)?.name ?? `#${c.branchId}`}
                      </td>
                    )}
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        c.scope === "Reservation" ? "bg-purple-50 text-purple-700 border-purple-200" :
                        c.scope === "Delivery"    ? "bg-orange-50 text-orange-700 border-orange-200" :
                        c.scope === "Pickup"      ? "bg-teal-50 text-teal-700 border-teal-200" :
                                                    "bg-gray-50 text-gray-700 border-gray-200"
                      }`}>{SCOPE_LABEL[c.scope]}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                        {c.closureType === "Weekly"
                          ? <><Repeat className="h-3.5 w-3.5 text-blue-500" />Weekly</>
                          : <><CalendarOff className="h-3.5 w-3.5 text-gray-400" />Date Range</>}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-700 whitespace-nowrap">
                      {c.closureType === "Weekly"
                        ? `Every ${DAY_NAMES[c.dayOfWeek ?? 0]}${c.startTime ? ` ${formatTimeStr(c.startTime)}` : ""}`
                        : `${formatDateStr(c.startDate ?? "")}${c.startTime ? ` ${formatTimeStr(c.startTime)}` : ""}`}
                    </td>
                    <td className="px-5 py-3 text-gray-700 whitespace-nowrap">
                      {c.closureType === "Weekly"
                        ? (c.endTime
                            ? formatTimeStr(c.endTime)
                            : <span className="text-gray-400 text-xs">All day</span>)
                        : `${formatDateStr(c.endDate ?? "")}${c.endTime ? ` ${formatTimeStr(c.endTime)}` : ""}`}
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs max-w-[160px] truncate">{c.note ?? "—"}</td>
                    <td className="px-5 py-3">
                      <Button variant="ghost" size="icon"
                        onClick={() => handleDelete(c)}
                        disabled={deleteClosureById.isPending}
                        className="text-muted-foreground hover:text-destructive h-8 w-8">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {listPageCount > 1 && (
          <PaginationBar page={listPage} pageCount={listPageCount} total={visibleClosures.length} pageSize={LIST_PAGE_SIZE} onChange={setListPage} />
        )}
      </section>
    </div>
  );
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

function PaginationBar({ page, pageCount, total, pageSize, onChange }: {
  page: number; pageCount: number; total: number; pageSize: number; onChange: (p: number) => void;
}) {
  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);
  return (
    <div className="flex items-center justify-between px-1">
      <span className="text-sm text-gray-500">Showing {from}–{to} of {total}</span>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(page - 1)} disabled={page === 1}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
          ← Prev
        </button>
        <span className="px-3 text-sm text-gray-600">{page} / {pageCount}</span>
        <button onClick={() => onChange(page + 1)} disabled={page === pageCount}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
          Next →
        </button>
      </div>
    </div>
  );
}

// ── History ───────────────────────────────────────────────────────────────────

function formatDt(iso: string) {
  return formatDateTime(iso);
}

function duration(closedAt: string, reopenedAt?: string) {
  const end = reopenedAt ? new Date(reopenedAt) : nowInDenmark();
  const diffMs = end.getTime() - new Date(closedAt).getTime();
  const h = Math.floor(diffMs / 3_600_000);
  const m = Math.floor((diffMs % 3_600_000) / 60_000);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

const SERVICE_TYPE_LABEL: Record<string, string> = {
  Reservation:  "Reservation",
  Delivery:     "Order - Delivery",
  Pickup:       "Order - Pickup",
  Order:        "Order",
};

function HistoryPanel({ branches, rows, filters, onFiltersChange }: {
  branches: AdminBranchDto[];
  rows: BranchServiceClosureDto[];
  filters: ServiceClosureFilters;
  onFiltersChange: (f: ServiceClosureFilters) => void;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const HIST_PAGE_SIZE = 20;

  const filtered = rows
    .filter(r => !search || r.branchName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const aOpen = !a.reopenedAt ? 0 : 1;
      const bOpen = !b.reopenedAt ? 0 : 1;
      if (aOpen !== bOpen) return aOpen - bOpen;
      return new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime();
    });

  const { branchId, serviceType, from, to } = filters;
  useEffect(() => { setPage(1); }, [branchId, serviceType, from, to, search]);

  const histPageCount = Math.ceil(filtered.length / HIST_PAGE_SIZE);
  const pagedHistory  = filtered.slice((page - 1) * HIST_PAGE_SIZE, page * HIST_PAGE_SIZE);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3 items-center">
        <input type="text" placeholder="Search branch..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-amber-400" />
        <BranchPicker
          branches={branches}
          value={filters.branchId}
          onChange={id => onFiltersChange({ ...filters, branchId: id })}
          allLabel="All branches"
          hideLabel
        />
        <select value={filters.serviceType ?? ""}
          onChange={e => onFiltersChange({ ...filters, serviceType: (e.target.value as any) || undefined })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
          <option value="">All Service</option>
          <option value="Reservation">Reservation</option>
          <option value="Delivery">Order - Delivery</option>
          <option value="Pickup">Order - Pickup</option>
        </select>
        <input type="date" value={filters.from ?? ""}
          onChange={e => onFiltersChange({ ...filters, from: e.target.value || undefined })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
        <span className="text-gray-400 text-sm">to</span>
        <input type="date" value={filters.to ?? ""}
          onChange={e => onFiltersChange({ ...filters, to: e.target.value || undefined })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
        {(filters.branchId || filters.serviceType || filters.from || filters.to) && (
          <button onClick={() => onFiltersChange({})} className="text-sm text-gray-500 hover:text-gray-800 underline">
            Clear
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-5 py-3 text-left font-semibold text-gray-700">Branch</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-700">Service</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-700">Closed At</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-700">Reopened At</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-700">Duration</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-700">By</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">No closure history found</td></tr>
            )}
            {pagedHistory.map(row => (
              <tr key={row.id}
                className={`${BRANCH_ROW_BG[branches.findIndex(b => b.name === row.branchName) % BRANCH_ROW_BG.length] ?? "bg-white"} ${!row.reopenedAt ? "border-l-2 border-red-400" : ""}`}>
                <td className="px-5 py-3 font-medium text-gray-900">{row.branchName}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    row.serviceType === "Order"       ? "bg-blue-50 text-blue-700 border-blue-200" :
                    row.serviceType === "Reservation" ? "bg-purple-50 text-purple-700 border-purple-200" :
                    row.serviceType === "Delivery"    ? "bg-orange-50 text-orange-700 border-orange-200" :
                                                        "bg-teal-50 text-teal-700 border-teal-200"
                  }`}>{SERVICE_TYPE_LABEL[row.serviceType] ?? row.serviceType}</span>
                </td>
                <td className="px-5 py-3 text-gray-700">{formatDt(row.closedAt)}</td>
                <td className="px-5 py-3">
                  {row.reopenedAt
                    ? <span className="text-gray-700">{formatDt(row.reopenedAt)}</span>
                    : <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />Still closed
                      </span>}
                </td>
                <td className="px-5 py-3 text-gray-600">{duration(row.closedAt, row.reopenedAt)}</td>
                <td className="px-5 py-3 text-gray-500 text-xs">{row.closedBy ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {histPageCount > 1 && (
        <PaginationBar page={page} pageCount={histPageCount} total={filtered.length} pageSize={HIST_PAGE_SIZE} onChange={setPage} />
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type SettingsTab = "schedule" | "pricing" | "closures";

const TABS: { id: SettingsTab; label: string }[] = [
  { id: "closures", label: "Availability & Closures" },
  { id: "schedule", label: "Weekly Schedule" },
  { id: "pricing",  label: "Pricing & Booking" },
];

function ServiceStatusPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("closures");
  const [filters, setFilters]     = useState<ServiceClosureFilters>({});
  const statusQ  = useServiceStatus();
  const historyQ = useServiceClosureHistory(filters);

  if (statusQ.isLoading) return <div className="p-8 text-center text-gray-500">Loading…</div>;
  if (statusQ.isError)   return <div className="p-8 text-center text-red-500">Failed to load settings.</div>;

  const branches = statusQ.data ?? [];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage branch controls and schedules. Changes take effect immediately.</p>
      </div>

      {/* Tab strip */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex flex-wrap gap-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-amber-500 text-amber-700"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === "schedule" && (
        branches.length === 0
          ? <p className="text-gray-400 text-sm">No branches found.</p>
          : <WeeklySchedulePanel branches={branches} />
      )}

      {activeTab === "pricing" && (
        branches.length === 0
          ? <p className="text-gray-400 text-sm">No branches found.</p>
          : <PricingBookingPanel branches={branches} />
      )}

      {activeTab === "closures" && (
        <div className="space-y-10">
          <AvailabilityClosuresPanel branches={branches} />

          <section className="border-t border-gray-200 pt-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Closure History</h2>
            {historyQ.isLoading ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading history…
              </div>
            ) : historyQ.isError ? (
              <div className="text-red-500 text-sm">Failed to load history.</div>
            ) : (
              <HistoryPanel branches={branches} rows={historyQ.data ?? []} filters={filters} onFiltersChange={setFilters} />
            )}
          </section>
        </div>
      )}
    </div>
  );
}
