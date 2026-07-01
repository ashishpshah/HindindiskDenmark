import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { UserCheck, UserX } from "lucide-react";
import { getPriority } from "@/lib/priority";
import { formatDate } from "@/lib/dateFormat";
import { toast } from "sonner";
import { useAdminReservations, type AdminReservationDto } from "@/hooks/useAdminReservations";
import { useUpdateReservationStatus } from "@/hooks/useUpdateReservationStatus";
import { useBranches } from "@/hooks/useBranches";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataTable, StatusBadge, type ColumnDef } from "@/components/ui/data-table";

export const Route = createFileRoute("/admin/reservations")({ component: AdminReservations });

const STATUS_COLORS: Record<string, string> = {
  Pending:   "bg-amber-100 text-amber-700",
  Confirmed: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
};

// B2 fixed: hook removed from child; isUpdating passed from parent
function ReservationExpandedRow({
  r,
  onStatus,
  isUpdating,
}: {
  r: AdminReservationDto;
  onStatus: (id: number, s: string) => void;
  isUpdating: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3 text-sm">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</p>
        <p className="font-medium">{r.contactName}</p>
        <p className="text-muted-foreground">{r.contactPhone}</p>
        <p className="text-muted-foreground text-xs">{r.contactEmail}</p>
      </div>
      {r.specialRequests && (
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Special Requests</p>
          <p className="italic text-muted-foreground">"{r.specialRequests}"</p>
        </div>
      )}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</p>
        <div className="flex gap-2 flex-wrap">
          {r.status !== "Confirmed" && (
            <Button size="sm" variant="outline" className="text-green-700 border-green-200 hover:bg-green-50"
              disabled={isUpdating} onClick={() => onStatus(r.id, "Confirmed")}>
              <UserCheck className="mr-1.5 h-3.5 w-3.5" /> Confirm
            </Button>
          )}
          {r.status !== "Cancelled" && (
            <Button size="sm" variant="outline" className="text-red-700 border-red-200 hover:bg-red-50"
              disabled={isUpdating} onClick={() => onStatus(r.id, "Cancelled")}>
              <UserX className="mr-1.5 h-3.5 w-3.5" /> Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminReservations() {
  const [filterStatus,   setFilterStatus]   = useState<string | undefined>();
  const [filterBranchId, setFilterBranchId] = useState<number | undefined>();
  const [filterDate,     setFilterDate]     = useState("");

  const { data: rawReservations = [], isLoading, refetch } = useAdminReservations({
    status: filterStatus, branchId: filterBranchId, date: filterDate || undefined,
  });
  const { data: branches = [] } = useBranches();
  const updateStatus = useUpdateReservationStatus();

  // Sort by priority: soonest / most urgent first
  const reservations = [...rawReservations].sort((a, b) => {
    const pa = getPriority(a.date, a.timeSlot);
    const pb = getPriority(b.date, b.timeSlot);
    if (pa.sort !== pb.sort) return pa.sort - pb.sort;
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.timeSlot.localeCompare(b.timeSlot);
  });

  const handle = async (id: number, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(`Reservation #${id} → ${status}`);
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Failed.");
    }
  };

  const columns: ColumnDef<AdminReservationDto, unknown>[] = [
    {
      id: "priority",
      header: "Priority",
      accessorFn: row => getPriority(row.date, row.timeSlot).sort,
      cell: ({ row }) => {
        const p = getPriority(row.original.date, row.original.timeSlot);
        return (
          <div className="flex flex-col gap-0.5 min-w-[80px]">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold ${p.badge}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${p.dot}`} />
              {p.label}
            </span>
            <span className="text-[10px] text-muted-foreground pl-1">{row.original.timeSlot}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "contactName",
      header: "Guest",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.contactName}</div>
          {row.original.isLinkedToAccount && (
            <span className="rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs">Member</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "branchName",
      header: "Branch",
      cell: info => info.getValue<string>().replace("Hind Indisk ", ""),
    },
    {
      accessorKey: "date",
      header: "Date",
    },
    {
      accessorKey: "timeSlot",
      header: "Time",
    },
    {
      accessorKey: "guestCount",
      header: "Guests",
      cell: info => <span className="tabular-nums">{info.getValue<number>()}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: info => <StatusBadge value={info.getValue<string>()} colorMap={STATUS_COLORS} />,
    },
    {
      accessorKey: "createdAt",
      header: "Booked On",
      cell: info => (
        <span className="text-xs text-muted-foreground">
          {formatDate(info.getValue<string>())}
        </span>
      ),
    },
  ];

  const toolbar = (
    <>
      {/* F3 fixed: added Pending to filter */}
      <Select value={filterStatus ?? "__all"} onValueChange={v => setFilterStatus(v === "__all" ? undefined : v)}>
        <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="All statuses" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="__all" className="text-xs">All statuses</SelectItem>
          <SelectItem value="Pending"   className="text-xs">Pending</SelectItem>
          <SelectItem value="Confirmed" className="text-xs">Confirmed</SelectItem>
          <SelectItem value="Cancelled" className="text-xs">Cancelled</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filterBranchId?.toString() ?? "__all"} onValueChange={v => setFilterBranchId(v === "__all" ? undefined : Number(v))}>
        <SelectTrigger className="h-8 w-48 text-xs"><SelectValue placeholder="All branches" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="__all" className="text-xs">All branches</SelectItem>
          {branches.map(b => <SelectItem key={b.id} value={String(b.id)} className="text-xs">{b.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <div className="flex items-center gap-1.5">
        <Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="h-8 w-36 text-xs" />
        {filterDate && (
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setFilterDate("")}>Clear</Button>
        )}
      </div>
    </>
  );

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold">Reservations</h1>
      <DataTable
        title="Reservations"
        columns={columns}
        data={reservations}
        isLoading={isLoading}
        toolbar={toolbar}
        onRefresh={refetch}
        getRowId={row => String(row.id)}
        expandedRow={row => (
          <ReservationExpandedRow
            r={row.original}
            onStatus={handle}
            isUpdating={updateStatus.isPending}
          />
        )}
      />
    </div>
  );
}
