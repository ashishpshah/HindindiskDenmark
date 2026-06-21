import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, RefreshCcw, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { useAdminReservations } from "@/hooks/useAdminReservations";
import { useUpdateReservationStatus } from "@/hooks/useUpdateReservationStatus";
import { useBranches } from "@/hooks/useBranches";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/reservations")({
  component: AdminReservations,
});

function AdminReservations() {
  const [filterStatus,   setFilterStatus]   = useState<string | undefined>();
  const [filterBranchId, setFilterBranchId] = useState<number | undefined>();
  const [filterDate,     setFilterDate]     = useState("");

  const { data: reservations = [], isLoading, refetch } = useAdminReservations({
    status:   filterStatus,
    branchId: filterBranchId,
    date:     filterDate || undefined,
  });
  const { data: branches = [] }  = useBranches();
  const updateStatus = useUpdateReservationStatus();

  const handle = async (id: number, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(`Reservation #${id} → ${status}`);
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Failed.");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold">Reservations</h1>
        <button onClick={() => refetch()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition">
          <RefreshCcw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterStatus ?? "__all"} onValueChange={(v) => setFilterStatus(v === "__all" ? undefined : v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All statuses</SelectItem>
            <SelectItem value="Confirmed">Confirmed</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterBranchId?.toString() ?? "__all"} onValueChange={(v) => setFilterBranchId(v === "__all" ? undefined : Number(v))}>
          <SelectTrigger className="w-52"><SelectValue placeholder="All branches" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All branches</SelectItem>
            {branches.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="w-40"
          placeholder="Filter by date"
        />
        {filterDate && (
          <Button variant="ghost" size="sm" onClick={() => setFilterDate("")}>Clear date</Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-10">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading reservations…
        </div>
      ) : reservations.length === 0 ? (
        <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">
          No reservations found.
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map((r) => (
            <div key={r.id} className="rounded-2xl border bg-card p-5 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">#{r.id}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      r.status === "Confirmed"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}>{r.status}</span>
                    {r.isLinkedToAccount && (
                      <span className="rounded-full bg-blue-100 text-blue-700 px-2.5 py-0.5 text-xs">Member</span>
                    )}
                  </div>
                  <div className="font-semibold">{r.contactName}</div>
                  <div className="text-sm text-muted-foreground">{r.contactPhone} · {r.contactEmail}</div>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-sm font-medium">{r.branchName.replace("Hind Indisk ", "")}</div>
                  <div className="text-sm text-muted-foreground">{r.date} at {r.timeSlot}</div>
                  <div className="text-sm text-muted-foreground">{r.guestCount} {r.guestCount === 1 ? "guest" : "guests"}</div>
                </div>
              </div>
              {r.specialRequests && (
                <div className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-xs italic text-muted-foreground">
                  "{r.specialRequests}"
                </div>
              )}
              <div className="mt-4 flex gap-2">
                {r.status !== "Confirmed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-700 border-green-200 hover:bg-green-50"
                    disabled={updateStatus.isPending}
                    onClick={() => handle(r.id, "Confirmed")}
                  >
                    <UserCheck className="mr-1.5 h-3.5 w-3.5" /> Confirm
                  </Button>
                )}
                {r.status !== "Cancelled" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-700 border-red-200 hover:bg-red-50"
                    disabled={updateStatus.isPending}
                    onClick={() => handle(r.id, "Cancelled")}
                  >
                    <UserX className="mr-1.5 h-3.5 w-3.5" /> Cancel
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
