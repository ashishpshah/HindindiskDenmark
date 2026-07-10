import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2, ChevronRight, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useAdminOrderStatuses, useCreateOrderStatus, useUpdateOrderStatusMeta, useDeleteOrderStatus, type OrderStatusDto, type CreateOrderStatusRequest, type UpdateOrderStatusMetaRequest } from "@/hooks/useAdminOrderStatuses";
import { useAdminOrderStatusTransitions, useCreateOrderStatusTransition, useDeleteOrderStatusTransition, type OrderStatusTransitionDto } from "@/hooks/useAdminOrderStatusTransitions";
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
  { value: "All", label: "All services" },
  { value: "Delivery", label: "Only Delivery" },
  { value: "Pickup", label: "Only Pickup" },
];

function StatusColorBadge({ color }: { color?: string | null }) {
  return (
    <span
      className="inline-block h-5 w-5 rounded-full border"
      style={{ backgroundColor: color ?? "#e5e7eb" }}
    />
  );
}

function ServiceBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    All: "bg-gray-100 text-gray-700",
    Delivery: "bg-blue-100 text-blue-700",
    Pickup: "bg-amber-100 text-amber-700",
  };
  const labels: Record<string, string> = {
    All: "All",
    Delivery: "Delivery",
    Pickup: "Pickup",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${colors[type] ?? "bg-gray-100 text-gray-700"}`}>
      {labels[type] ?? type}
    </span>
  );
}

function AdminOrderStatuses() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const { data: statuses = [], isLoading: loadingStatuses } = useAdminOrderStatuses();
  const { data: transitions = [], isLoading: loadingTransitions } = useAdminOrderStatusTransitions();
  const createStatus = useCreateOrderStatus();
  const updateStatus = useUpdateOrderStatusMeta();
  const deleteStatus = useDeleteOrderStatus();
  const createTransition = useCreateOrderStatusTransition();
  const deleteTransition = useDeleteOrderStatusTransition();

  const [editStatus, setEditStatus] = useState<OrderStatusDto | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showTransitionDialog, setShowTransitionDialog] = useState(false);
  const [statusForm, setStatusForm] = useState<CreateOrderStatusRequest>({
    name: "", nameDa: "", serviceType: "All", displayOrder: 1, color: "#3B82F6",
  });
  const [transitionForm, setTransitionForm] = useState({ fromStatusId: 0, toStatusId: 0, serviceType: "All" });
  const [submitting, setSubmitting] = useState(false);

  const activeTab = tab === "transitions" ? "transitions" : "statuses";
  const setTab = (t: string) => navigate({ search: { tab: t } });

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
        await updateStatus.mutateAsync({
          id: editStatus.id,
          data: { ...statusForm, isActive: editStatus.isActive },
        });
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
        data: {
          name: s.name, nameDa: s.nameDa ?? undefined,
          serviceType: s.serviceType, displayOrder: s.displayOrder,
          color: s.color ?? undefined, isActive: !s.isActive,
        },
      });
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Failed to toggle status.");
    }
  };

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Order Statuses</h1>
      </div>

      {/* Tabs */}
      <div className="inline-flex items-center rounded-lg bg-muted p-1 gap-0.5">
        <button
          onClick={() => setTab("statuses")}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
            activeTab === "statuses" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Statuses ({statuses.length})
        </button>
        <button
          onClick={() => setTab("transitions")}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
            activeTab === "transitions" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Transitions ({transitions.length})
        </button>
      </div>

      {/* Statuses tab */}
      {activeTab === "statuses" && (
        <div className="rounded-xl border overflow-hidden">
          {loadingStatuses ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading…
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50 border-b">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {statuses.length} status{statuses.length !== 1 ? "es" : ""}
                </span>
                <Button size="sm" className="h-7 text-xs gap-1" onClick={openNewStatus}>
                  <Plus className="h-3.5 w-3.5" /> New Status
                </Button>
              </div>
              <div className="divide-y">
                {statuses.map(s => (
                  <div key={s.id} className="flex items-center gap-4 px-4 py-3 text-sm">
                    <StatusColorBadge color={s.color} />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{s.name}</span>
                      {s.nameDa && <span className="ml-2 text-muted-foreground">({s.nameDa})</span>}
                    </div>
                    <ServiceBadge type={s.serviceType} />
                    <span className="text-muted-foreground text-xs w-16 text-center">#{s.displayOrder}</span>
                    {s.isTerminal && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Terminal</span>
                    )}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={s.isActive}
                        onChange={() => handleToggleActive(s)}
                      />
                      <div className="w-8 h-4 bg-muted rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4" />
                    </label>
                    <button onClick={() => openEditStatus(s)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDeleteStatus(s.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Transitions tab */}
      {activeTab === "transitions" && (
        <div className="rounded-xl border overflow-hidden">
          {loadingTransitions ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading…
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50 border-b">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {transitions.length} transition{transitions.length !== 1 ? "s" : ""}
                </span>
                <Button size="sm" className="h-7 text-xs gap-1" onClick={() => setShowTransitionDialog(true)}>
                  <Plus className="h-3.5 w-3.5" /> Add Transition
                </Button>
              </div>
              <div className="divide-y">
                {transitions.map(t => (
                  <div key={t.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                    <span className="font-medium">{t.fromStatusName}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{t.toStatusName}</span>
                    <div className="flex-1" />
                    <ServiceBadge type={t.serviceType} />
                    <button onClick={() => handleDeleteTransition(t.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editStatus ? "Edit Status" : "New Status"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Name (EN)</Label>
                <Input
                  value={statusForm.name}
                  onChange={e => setStatusForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. New"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Name (DA)</Label>
                <Input
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
                <Input
                  type="number" min={1}
                  value={statusForm.displayOrder}
                  onChange={e => setStatusForm(f => ({ ...f, displayOrder: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={statusForm.color ?? "#3B82F6"}
                  onChange={e => setStatusForm(f => ({ ...f, color: e.target.value }))}
                  className="h-9 w-9 rounded border cursor-pointer"
                />
                <Input
                  value={statusForm.color ?? ""}
                  onChange={e => setStatusForm(f => ({ ...f, color: e.target.value }))}
                  placeholder="#3B82F6"
                  className="font-mono"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveStatus} disabled={submitting}>
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Saving…</> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transition Dialog */}
      <Dialog open={showTransitionDialog} onOpenChange={setShowTransitionDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Transition</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">From Status</Label>
              <Select value={String(transitionForm.fromStatusId)} onValueChange={v => setTransitionForm(f => ({ ...f, fromStatusId: Number(v) }))}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {activeStatuses.map(s => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">To Status</Label>
              <Select value={String(transitionForm.toStatusId)} onValueChange={v => setTransitionForm(f => ({ ...f, toStatusId: Number(v) }))}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {activeStatuses.filter(s => s.id !== transitionForm.fromStatusId).map(s => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Service Type</Label>
              <Select value={transitionForm.serviceType} onValueChange={v => setTransitionForm(f => ({ ...f, serviceType: v }))}>
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
            <Button variant="outline" onClick={() => setShowTransitionDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateTransition} disabled={submitting}>
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Adding…</> : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
