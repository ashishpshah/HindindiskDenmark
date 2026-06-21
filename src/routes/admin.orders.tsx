import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { useAdminOrders } from "@/hooks/useAdminOrders";
import { useUpdateOrderStatus } from "@/hooks/useUpdateOrderStatus";
import { useBranches } from "@/hooks/useBranches";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

const ORDER_STATUSES = ["Placed", "Accepted", "Preparing", "Ready", "OutForDelivery", "Completed", "Cancelled"];

const STATUS_COLORS: Record<string, string> = {
  Placed:         "bg-blue-100 text-blue-700",
  Accepted:       "bg-indigo-100 text-indigo-700",
  Preparing:      "bg-amber-100 text-amber-700",
  Ready:          "bg-cyan-100 text-cyan-700",
  OutForDelivery: "bg-purple-100 text-purple-700",
  Completed:      "bg-green-100 text-green-700",
  Cancelled:      "bg-red-100 text-red-700",
};

function AdminOrders() {
  const [filterStatus,   setFilterStatus]   = useState<string | undefined>();
  const [filterBranchId, setFilterBranchId] = useState<number | undefined>();

  const { data: orders = [], isLoading, refetch } = useAdminOrders({
    status:   filterStatus,
    branchId: filterBranchId,
  });
  const { data: branches = [] } = useBranches();
  const updateStatus = useUpdateOrderStatus();

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(`Order #${id} → ${status}`);
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Failed to update status.");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold">Orders</h1>
        <button onClick={() => refetch()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition">
          <RefreshCcw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterStatus ?? "__all"} onValueChange={(v) => setFilterStatus(v === "__all" ? undefined : v)}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All statuses</SelectItem>
            {ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterBranchId?.toString() ?? "__all"} onValueChange={(v) => setFilterBranchId(v === "__all" ? undefined : Number(v))}>
          <SelectTrigger className="w-52"><SelectValue placeholder="All branches" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All branches</SelectItem>
            {branches.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-10">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading orders…
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">
          No orders found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                {["ID", "Customer", "Branch", "Type", "Items", "Total", "Status", "Date", "Action"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-muted/30 transition">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{o.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{o.customerName}</div>
                    <div className="text-xs text-muted-foreground">{o.customerEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">{o.branchName.replace("Hind Indisk ", "")}</td>
                  <td className="px-4 py-3">{o.orderType}</td>
                  <td className="px-4 py-3 text-center">{o.itemCount}</td>
                  <td className="px-4 py-3 font-semibold">{o.total} DKK</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[o.status] ?? "bg-muted text-muted-foreground"}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(o.createdAt).toLocaleDateString("en-DK", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={o.status}
                      onValueChange={(v) => handleStatusChange(o.id, v)}
                      disabled={updateStatus.isPending}
                    >
                      <SelectTrigger className="h-7 w-36 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map((s) => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
