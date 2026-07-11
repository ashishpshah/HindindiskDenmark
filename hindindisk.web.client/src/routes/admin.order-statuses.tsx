import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import {
  useAdminOrderStatuses, useCreateOrderStatus, useUpdateOrderStatusMeta, useDeleteOrderStatus,
  type OrderStatusDto, type CreateOrderStatusRequest,
} from "@/hooks/useAdminOrderStatuses";
import {
  useAdminOrderStatusTransitions, useCreateOrderStatusTransition, useDeleteOrderStatusTransition,
  type OrderStatusTransitionDto,
} from "@/hooks/useAdminOrderStatusTransitions";
import { DataTable, type ColumnDef, ActionButtons } from "@/components/ui/data-table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/order-statuses")({
  component: AdminOrderStatuses,
});

const SERVICE_OPTIONS = [
  { value: "All",      label: "All services" },
  { value: "Delivery", label: "Only Delivery" },
  { value: "Pickup",   label: "Only Pickup" },
];

// ── Small helpers ─────────────────────────────────────────────────────────────

function ServiceBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    All:      "bg-gray-100 text-gray-700",
    Delivery: "bg-blue-100 text-blue-700",
    Pickup:   "bg-amber-100 text-amber-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${colors[type] ?? "bg-gray-100 text-gray-700"}`}>
      {type}
    </span>
  );
}

function ColorCell({ color }: { color?: string | null }) {
  const hex = color ?? "#e5e7eb";
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block h-5 w-5 shrink-0 rounded-full border shadow-sm"
        style={{ backgroundColor: hex }}
      />
      <span className="font-mono text-xs text-muted-foreground">{hex}</span>
    </div>
  );
}

function ActiveToggle({ status, onToggle }: { status: OrderStatusDto; onToggle: () => void }) {
  return (
    <label className="relative inline-flex cursor-pointer items-center" onClick={e => e.stopPropagation()}>
      <input type="checkbox" className="sr-only peer" checked={status.isActive} onChange={onToggle} data-tagid={`input-order-statuses-active-${status.name}`} />
      <div className="h-4 w-8 rounded-full bg-muted peer-checked:bg-primary after:absolute after:start-[2px] after:top-[2px] after:h-3 after:w-3 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-4" />
      <span className={`ml-2 text-xs font-medium ${status.isActive ? "text-green-700" : "text-muted-foreground"}`}>
        {status.isActive ? "Active" : "Inactive"}
      </span>
    </label>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

function AdminOrderStatuses() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const { data: statuses = [],    isLoading: loadingStatuses    } = useAdminOrderStatuses();
  const { data: transitions = [], isLoading: loadingTransitions } = useAdminOrderStatusTransitions();

  const createStatus    = useCreateOrderStatus();
  const updateStatus    = useUpdateOrderStatusMeta();
  const deleteStatus    = useDeleteOrderStatus();
  const createTransition = useCreateOrderStatusTransition();
  const deleteTransition = useDeleteOrderStatusTransition();

  const [editStatus,           setEditStatus]           = useState<OrderStatusDto | null>(null);
  const [showStatusDialog,     setShowStatusDialog]     = useState(false);
  const [showTransitionDialog, setShowTransitionDialog] = useState(false);
  const [statusForm,           setStatusForm]           = useState<CreateOrderStatusRequest>({
    name: "", nameDa: "", serviceType: "All", displayOrder: 1, color: "#3B82F6",
  });
  const [transitionForm, setTransitionForm] = useState({ fromStatusId: 0, toStatusId: 0, serviceType: "All" });
  const [submitting, setSubmitting] = useState(false);

  const activeTab = tab === "transitions" ? "transitions" : "statuses";
  const setTab    = (t: string) => navigate({ search: { tab: t } });

  // ── Status dialog ───────────────────────────────────────────────────────────

  const openNewStatus = () => {
    setEditStatus(null);
    setStatusForm({ name: "", nameDa: "", serviceType: "All", displayOrder: statuses.length + 1, color: "#3B82F6" });
    setShowStatusDialog(true);
  };

  const openEditStatus = (s: OrderStatusDto) => {
    setEditStatus(s);
    setStatusForm({
      name: s.name, nameDa: s.nameDa ?? "", serviceType: s.serviceType,
      displayOrder: s.displayOrder, color: s.color ?? "#3B82F6",
    });
    setShowStatusDialog(true);
  };

  const handleSaveStatus = async () => {
    if (!statusForm.name.trim()) { toast.error("Name is required."); return; }
    setSubmitting(true);
    try {
      if (editStatus) {
        await updateStatus.mutateAsync({ id: editStatus.id, data: { ...statusForm, isActive: editStatus.isActive } });
        toast.success("Status updated.");
      } else {
        await createStatus.mutateAsync(statusForm);
        toast.success("Status created.");
      }
      setShowStatusDialog(false);
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Failed to save status.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStatus = async (id: number) => {
    if (!confirm("Delete this status? This cannot be undone.")) return;
    try {
      await deleteStatus.mutateAsync(id);
      toast.success("Status deleted.");
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Failed to delete status.");
    }
  };

  const handleToggleActive = async (s: OrderStatusDto) => {
    try {
      await updateStatus.mutateAsync({
        id: s.id,
        data: { name: s.name, nameDa: s.nameDa ?? undefined, serviceType: s.serviceType, displayOrder: s.displayOrder, color: s.color ?? undefined, isActive: !s.isActive },
      });
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Failed to toggle status.");
    }
  };

  // ── Transition handlers ─────────────────────────────────────────────────────

  const handleCreateTransition = async () => {
    if (!transitionForm.fromStatusId || !transitionForm.toStatusId) {
      toast.error("Select both statuses."); return;
    }
    setSubmitting(true);
    try {
      await createTransition.mutateAsync(transitionForm);
      toast.success("Transition created.");
      setShowTransitionDialog(false);
      setTransitionForm({ fromStatusId: 0, toStatusId: 0, serviceType: "All" });
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Failed to create transition.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTransition = async (id: number) => {
    if (!confirm("Delete this transition?")) return;
    try {
      await deleteTransition.mutateAsync(id);
      toast.success("Transition deleted.");
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Failed to delete transition.");
    }
  };

  const activeStatuses = statuses.filter(s => s.isActive);

  // ── Column definitions ──────────────────────────────────────────────────────

  const statusColumns = useMemo<ColumnDef<OrderStatusDto>[]>(() => [
    {
      id: "name",
      header: "Name EN",
      accessorKey: "name",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      id: "nameDa",
      header: "Name DA",
      accessorKey: "nameDa",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.nameDa ?? "—"}</span>
      ),
    },
    {
      id: "serviceType",
      header: "Service",
      accessorKey: "serviceType",
      cell: ({ row }) => <ServiceBadge type={row.original.serviceType} />,
    },
    {
      id: "color",
      header: "Color",
      accessorKey: "color",
      enableSorting: false,
      cell: ({ row }) => <ColorCell color={row.original.color} />,
    },
    {
      id: "isActive",
      header: "Status",
      accessorKey: "isActive",
      cell: ({ row }) => (
        <ActiveToggle status={row.original} onToggle={() => handleToggleActive(row.original)} />
      ),
    },
    {
      id: "__actions",
      header: "Actions",
      enableSorting: false,
      enableColumnFilter: false,
      cell: ({ row }) => (
        <ActionButtons
          onEdit={() => openEditStatus(row.original)}
          onDelete={() => handleDeleteStatus(row.original.id)}
        />
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [statuses]);

  const transitionColumns = useMemo<ColumnDef<OrderStatusTransitionDto>[]>(() => [
    {
      id: "fromStatusName",
      header: "From",
      accessorKey: "fromStatusName",
      cell: ({ row }) => <span className="font-medium">{row.original.fromStatusName}</span>,
    },
    {
      id: "__arrow",
      header: "",
      enableSorting: false,
      enableColumnFilter: false,
      size: 32,
      cell: () => <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />,
    },
    {
      id: "toStatusName",
      header: "To",
      accessorKey: "toStatusName",
      cell: ({ row }) => <span className="font-medium">{row.original.toStatusName}</span>,
    },
    {
      id: "serviceType",
      header: "Service",
      accessorKey: "serviceType",
      cell: ({ row }) => <ServiceBadge type={row.original.serviceType} />,
    },
    {
      id: "__actions",
      header: "Actions",
      enableSorting: false,
      enableColumnFilter: false,
      cell: ({ row }) => (
        <ActionButtons onDelete={() => handleDeleteTransition(row.original.id)} />
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold">Order Statuses</h1>

      {/* ── Tabs ── */}
      <div className="inline-flex items-center rounded-lg bg-muted p-1 gap-0.5">
        <button data-tagid="button-order-statuses-statuses-tab"
          onClick={() => setTab("statuses")}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
            activeTab === "statuses"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Statuses ({statuses.length})
        </button>
        <button data-tagid="button-order-statuses-transitions-tab"
          onClick={() => setTab("transitions")}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
            activeTab === "transitions"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Transitions ({transitions.length})
        </button>
      </div>

      {/* ── Statuses tab ── */}
      {activeTab === "statuses" && (
        <DataTable
          title="Order Statuses"
          columns={statusColumns}
          data={statuses}
          isLoading={loadingStatuses}
          toolbar={
            <Button size="sm" className="h-8 gap-1 text-xs gradient-primary text-primary-foreground" onClick={openNewStatus} data-tagid="button-order-statuses-new-status">
              <Plus className="h-3.5 w-3.5" /> New Status
            </Button>
          }
        />
      )}

      {/* ── Transitions tab ── */}
      {activeTab === "transitions" && (
        <DataTable
          title="Order Status Transitions"
          columns={transitionColumns}
          data={transitions}
          isLoading={loadingTransitions}
          toolbar={
            <Button size="sm" className="h-8 gap-1 text-xs gradient-primary text-primary-foreground" onClick={() => setShowTransitionDialog(true)} data-tagid="button-order-statuses-add-transition">
              <Plus className="h-3.5 w-3.5" /> Add Transition
            </Button>
          }
        />
      )}

      {/* ── Status Dialog ── */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editStatus ? "Edit Status" : "New Status"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Name (EN)</Label>
                <Input data-tagid="input-order-statuses-name-en"
                  value={statusForm.name}
                  onChange={e => setStatusForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. New"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Name (DA)</Label>
                <Input data-tagid="input-order-statuses-name-da"
                  value={statusForm.nameDa ?? ""}
                  onChange={e => setStatusForm(f => ({ ...f, nameDa: e.target.value }))}
                  placeholder="e.g. Ny"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Service Type</Label>
                <Select value={statusForm.serviceType} onValueChange={v => setStatusForm(f => ({ ...f, serviceType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SERVICE_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Display Order</Label>
                <Input data-tagid="input-order-statuses-display-order"
                  type="number" min={1}
                  value={statusForm.displayOrder}
                  onChange={e => setStatusForm(f => ({ ...f, displayOrder: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Color</Label>
              <div className="flex items-center gap-3">
                <input data-tagid="input-order-statuses-color"
                  type="color"
                  value={statusForm.color ?? "#3B82F6"}
                  onChange={e => setStatusForm(f => ({ ...f, color: e.target.value }))}
                  className="h-9 w-9 cursor-pointer rounded border"
                />
                <Input data-tagid="input-order-statuses-color-hex"
                  value={statusForm.color ?? ""}
                  onChange={e => setStatusForm(f => ({ ...f, color: e.target.value }))}
                  placeholder="#3B82F6"
                  className="font-mono"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)} data-tagid="button-order-statuses-cancel-status-dialog">Cancel</Button>
            <Button onClick={handleSaveStatus} disabled={submitting} data-tagid="button-order-statuses-save-status">
              {submitting ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Saving…</> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Transition Dialog ── */}
      <Dialog open={showTransitionDialog} onOpenChange={setShowTransitionDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Transition</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">From Status</Label>
              <Select
                value={String(transitionForm.fromStatusId)}
                onValueChange={v => setTransitionForm(f => ({ ...f, fromStatusId: Number(v) }))}
              >
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {activeStatuses.map(s => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">To Status</Label>
              <Select
                value={String(transitionForm.toStatusId)}
                onValueChange={v => setTransitionForm(f => ({ ...f, toStatusId: Number(v) }))}
              >
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {activeStatuses
                    .filter(s => s.id !== transitionForm.fromStatusId)
                    .map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Service Type</Label>
              <Select
                value={transitionForm.serviceType}
                onValueChange={v => setTransitionForm(f => ({ ...f, serviceType: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SERVICE_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransitionDialog(false)} data-tagid="button-order-statuses-cancel-transition-dialog">Cancel</Button>
            <Button onClick={handleCreateTransition} disabled={submitting} data-tagid="button-order-statuses-add-transition-submit">
              {submitting ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Adding…</> : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
