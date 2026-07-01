import { createFileRoute } from "@tanstack/react-router";
import { nowInDenmark } from "@/lib/denmarkTime";
import { formatDateTime } from "@/lib/dateFormat";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  useServiceStatus,
  useServiceClosureHistory,
  useToggleServiceStatus,
  type BranchServiceClosureDto,
  type ServiceClosureFilters,
} from "@/hooks/useServiceStatus";
import { useUpdateBranch, type AdminBranchDto, type UpdateBranchInput } from "@/hooks/useUpdateBranch";
import { useSchedule, useUpsertSchedule, type DayScheduleDto } from "@/hooks/useSchedule";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Check } from "lucide-react";

export const Route = createFileRoute("/admin/service-status")({ component: ServiceStatusPage });

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
    deliveryEnabled: b.deliveryEnabled, pickupEnabled: b.pickupEnabled,
    deliveryFee: b.deliveryFee, deliveryFeeEnabled: b.deliveryFeeEnabled,
    maxAdvanceDays: b.maxAdvanceDays,
  };
}

// ── Service Controls (Orders / Reservations toggle) ───────────────────────────

function ToggleButton({ label, isClosed, loading, onToggle }: {
  label: string; isClosed: boolean; loading: boolean; onToggle: () => void;
}) {
  return (
    <button onClick={onToggle} disabled={loading}
      className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        isClosed
          ? "bg-red-100 text-red-700 border-red-200 hover:bg-red-200"
          : "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
      }`}>
      <span className={`w-2 h-2 rounded-full ${isClosed ? "bg-red-500" : "bg-green-500"}`} />
      {isClosed ? `${label}: Closed` : `${label}: Open`}
    </button>
  );
}

function StatusPanel({ branches }: { branches: AdminBranchDto[] }) {
  const toggle = useToggleServiceStatus();

  function handleToggle(branchId: number, serviceType: "Order" | "Reservation", currentlyClosed: boolean) {
    const next = !currentlyClosed;
    toggle.mutate({ branchId, serviceType, isClosed: next }, {
      onSuccess: () => toast.success(`${serviceType} service ${next ? "closed" : "reopened"} successfully`),
      onError:   () => toast.error("Failed to update service status"),
    });
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-6 py-3 text-left font-semibold text-gray-700">Branch</th>
            <th className="px-6 py-3 text-left font-semibold text-gray-700">Orders</th>
            <th className="px-6 py-3 text-left font-semibold text-gray-700">Reservations</th>
          </tr>
        </thead>
        <tbody>
          {branches.map((b, i) => (
            <tr key={b.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
              <td className="px-6 py-4 font-medium text-gray-900">
                <div>{b.name}</div>
                <div className="text-xs text-gray-500">{b.city}</div>
              </td>
              <td className="px-6 py-4">
                <ToggleButton label="Orders" isClosed={b.isCloseOrder} loading={toggle.isPending}
                  onToggle={() => handleToggle(b.id, "Order", b.isCloseOrder)} />
              </td>
              <td className="px-6 py-4">
                <ToggleButton label="Reservations" isClosed={b.isCloseReservation} loading={toggle.isPending}
                  onToggle={() => handleToggle(b.id, "Reservation", b.isCloseReservation)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Order Types ───────────────────────────────────────────────────────────────

function OrderTypesPanel({ branches }: { branches: AdminBranchDto[] }) {
  const qc = useQueryClient();
  const update = useUpdateBranch();

  const handleToggle = (b: AdminBranchDto, field: "deliveryEnabled" | "pickupEnabled", value: boolean) => {
    update.mutate({ ...branchPayload(b), [field]: value }, {
      onSuccess: () => { toast.success(`${b.name} updated`); qc.invalidateQueries({ queryKey: ["service-status"] }); },
      onError:   () => toast.error("Failed to update"),
    });
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-6 py-3 text-left font-semibold text-gray-700">Branch</th>
            <th className="px-6 py-3 text-left font-semibold text-gray-700">Delivery</th>
            <th className="px-6 py-3 text-left font-semibold text-gray-700">Pickup</th>
          </tr>
        </thead>
        <tbody>
          {branches.map((b, i) => (
            <tr key={b.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
              <td className="px-6 py-4 font-medium text-gray-900">
                <div>{b.name}</div>
                <div className="text-xs text-gray-500">{b.city}</div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <Switch checked={b.deliveryEnabled} disabled={update.isPending}
                    onCheckedChange={v => handleToggle(b, "deliveryEnabled", v)} />
                  <span className={`text-xs font-medium ${b.deliveryEnabled ? "text-green-700" : "text-gray-400"}`}>
                    {b.deliveryEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <Switch checked={b.pickupEnabled} disabled={update.isPending}
                    onCheckedChange={v => handleToggle(b, "pickupEnabled", v)} />
                  <span className={`text-xs font-medium ${b.pickupEnabled ? "text-green-700" : "text-gray-400"}`}>
                    {b.pickupEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Delivery Fee / Pricing ────────────────────────────────────────────────────

function PricingPanel({ branches }: { branches: AdminBranchDto[] }) {
  const qc = useQueryClient();
  const update = useUpdateBranch();
  const [fees, setFees] = useState<Record<number, string>>({});

  useEffect(() => {
    setFees(Object.fromEntries(branches.map(b => [b.id, String(b.deliveryFee)])));
  }, [branches]);

  const save = (b: AdminBranchDto, patch: Partial<{ deliveryFee: number; deliveryFeeEnabled: boolean }>) => {
    update.mutate({ ...branchPayload(b), ...patch }, {
      onSuccess: () => { toast.success("Pricing updated"); qc.invalidateQueries({ queryKey: ["service-status"] }); },
      onError:   () => toast.error("Failed to update"),
    });
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-6 py-3 text-left font-semibold text-gray-700">Branch</th>
            <th className="px-6 py-3 text-left font-semibold text-gray-700">Delivery Fee (DKK)</th>
            <th className="px-6 py-3 text-left font-semibold text-gray-700">Fee Enabled</th>
          </tr>
        </thead>
        <tbody>
          {branches.map((b, i) => (
            <tr key={b.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
              <td className="px-6 py-4 font-medium text-gray-900">
                <div>{b.name}</div>
                <div className="text-xs text-gray-500">{b.city}</div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <Input type="number" min={0} step={1}
                    value={fees[b.id] ?? ""}
                    onChange={e => setFees(prev => ({ ...prev, [b.id]: e.target.value }))}
                    className="h-8 w-24 text-sm"
                    disabled={!b.deliveryFeeEnabled} />
                  <button
                    onClick={() => save(b, { deliveryFee: parseFloat(fees[b.id]) || 0 })}
                    disabled={update.isPending || !b.deliveryFeeEnabled}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    Save
                  </button>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <Switch checked={b.deliveryFeeEnabled} disabled={update.isPending}
                    onCheckedChange={v => save(b, { deliveryFeeEnabled: v })} />
                  <span className={`text-xs font-medium ${b.deliveryFeeEnabled ? "text-green-700" : "text-gray-400"}`}>
                    {b.deliveryFeeEnabled ? "On" : "Off"}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Advance Booking ───────────────────────────────────────────────────────────

function AdvanceBookingPanel({ branches }: { branches: AdminBranchDto[] }) {
  const qc = useQueryClient();
  const update = useUpdateBranch();
  const [days, setDays] = useState<Record<number, string>>({});

  useEffect(() => {
    setDays(Object.fromEntries(branches.map(b => [b.id, String(b.maxAdvanceDays)])));
  }, [branches]);

  const save = (b: AdminBranchDto) => {
    update.mutate({ ...branchPayload(b), maxAdvanceDays: parseInt(days[b.id]) || 0 }, {
      onSuccess: () => { toast.success("Advance booking updated"); qc.invalidateQueries({ queryKey: ["service-status"] }); },
      onError:   () => toast.error("Failed to update"),
    });
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-6 py-3 text-left font-semibold text-gray-700">Branch</th>
            <th className="px-6 py-3 text-left font-semibold text-gray-700">Max Advance Days</th>
          </tr>
        </thead>
        <tbody>
          {branches.map((b, i) => (
            <tr key={b.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
              <td className="px-6 py-4 font-medium text-gray-900">
                <div>{b.name}</div>
                <div className="text-xs text-gray-500">{b.city}</div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <Input type="number" min={0} max={90}
                    value={days[b.id] ?? ""}
                    onChange={e => setDays(prev => ({ ...prev, [b.id]: e.target.value }))}
                    className="h-8 w-20 text-sm" />
                  <span className="text-xs text-gray-500">days ahead</span>
                  <button
                    onClick={() => save(b)}
                    disabled={update.isPending}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    Save
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Weekly Schedule ───────────────────────────────────────────────────────────

function WeeklySchedulePanel({ branches }: { branches: AdminBranchDto[] }) {
  const [selectedBranchId, setSelectedBranchId] = useState<number>(branches[0]?.id ?? 0);
  const { data: scheduleData = [], isLoading } = useSchedule(selectedBranchId);
  const upsertSchedule = useUpsertSchedule(selectedBranchId);
  const [rows, setRows] = useState<ScheduleRow[]>(() => buildDefaultRows([]));

  useEffect(() => {
    setRows(buildDefaultRows(scheduleData));
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
      <select
        value={selectedBranchId}
        onChange={e => setSelectedBranchId(Number(e.target.value))}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>

      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-500 text-sm py-6">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading schedule…
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border divide-y bg-white">
            {rows.map(row => (
              <div key={row.dayOfWeek}
                className={`grid grid-cols-[140px_1fr] gap-4 p-4 items-start ${!row.isOpen ? "opacity-50" : ""}`}>

                <div className="flex items-center gap-3 pt-1">
                  <Switch checked={row.isOpen} onCheckedChange={v => updateRow(row.dayOfWeek, { isOpen: v })} />
                  <span className="text-sm font-medium">{DAY_NAMES[row.dayOfWeek]}</span>
                </div>

                {row.isOpen ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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

function HistoryPanel({ branches, rows, filters, onFiltersChange }: {
  branches: AdminBranchDto[];
  rows: BranchServiceClosureDto[];
  filters: ServiceClosureFilters;
  onFiltersChange: (f: ServiceClosureFilters) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = rows.filter(r => !search || r.branchName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3 items-center">
        <input type="text" placeholder="Search branch..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-amber-400" />
        <select value={filters.branchId ?? ""}
          onChange={e => onFiltersChange({ ...filters, branchId: e.target.value ? Number(e.target.value) : undefined })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
          <option value="">All branches</option>
          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select value={filters.serviceType ?? ""}
          onChange={e => onFiltersChange({ ...filters, serviceType: e.target.value as "Order" | "Reservation" | undefined || undefined })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
          <option value="">All services</option>
          <option value="Order">Orders</option>
          <option value="Reservation">Reservations</option>
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
            {filtered.map((row, i) => (
              <tr key={row.id}
                className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"} ${!row.reopenedAt ? "border-l-2 border-red-400" : ""}`}>
                <td className="px-5 py-3 font-medium text-gray-900">{row.branchName}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    row.serviceType === "Order"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-purple-50 text-purple-700 border-purple-200"
                  }`}>{row.serviceType}</span>
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
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function ServiceStatusPage() {
  const [filters, setFilters] = useState<ServiceClosureFilters>({});
  const statusQ  = useServiceStatus();
  const historyQ = useServiceClosureHistory(filters);

  if (statusQ.isLoading) return <div className="p-8 text-center text-gray-500">Loading service status...</div>;
  if (statusQ.isError)   return <div className="p-8 text-center text-red-500">Failed to load service status.</div>;

  const branches = statusQ.data ?? [];

  return (
    <div className="flex flex-col gap-8 p-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Service Status</h1>
        <p className="text-sm text-gray-500 mt-1">Manage branch controls and schedules. Changes take effect immediately.</p>
      </div>

      <section>
        <h2 className="text-base font-semibold text-gray-800 mb-1">Branch Controls — Service</h2>
        <p className="text-xs text-gray-500 mb-3">Temporarily close or reopen order and reservation acceptance per branch.</p>
        {branches.length === 0 ? <p className="text-gray-400 text-sm">No branches found.</p> : <StatusPanel branches={branches} />}
      </section>

      <section>
        <h2 className="text-base font-semibold text-gray-800 mb-1">Order Types</h2>
        <p className="text-xs text-gray-500 mb-3">Enable or disable delivery and pickup order types per branch.</p>
        {branches.length === 0 ? <p className="text-gray-400 text-sm">No branches found.</p> : <OrderTypesPanel branches={branches} />}
      </section>

      <section>
        <h2 className="text-base font-semibold text-gray-800 mb-1">Delivery Fee / Pricing</h2>
        <p className="text-xs text-gray-500 mb-3">Set the delivery fee and whether it is charged per branch.</p>
        {branches.length === 0 ? <p className="text-gray-400 text-sm">No branches found.</p> : <PricingPanel branches={branches} />}
      </section>

      <section>
        <h2 className="text-base font-semibold text-gray-800 mb-1">Advance Booking</h2>
        <p className="text-xs text-gray-500 mb-3">How many days ahead customers can schedule orders (0 = today only).</p>
        {branches.length === 0 ? <p className="text-gray-400 text-sm">No branches found.</p> : <AdvanceBookingPanel branches={branches} />}
      </section>

      <section>
        <h2 className="text-base font-semibold text-gray-800 mb-1">Weekly Schedule</h2>
        <p className="text-xs text-gray-500 mb-3">Configure opening hours and slot capacity per branch.</p>
        {branches.length > 0 && <WeeklySchedulePanel branches={branches} />}
      </section>

      <section>
        <h2 className="text-base font-semibold text-gray-800 mb-3">Closure History</h2>
        {historyQ.isLoading ? (
          <div className="text-gray-400 text-sm">Loading history...</div>
        ) : historyQ.isError ? (
          <div className="text-red-500 text-sm">Failed to load history.</div>
        ) : (
          <HistoryPanel branches={branches} rows={historyQ.data ?? []} filters={filters} onFiltersChange={setFilters} />
        )}
      </section>
    </div>
  );
}
