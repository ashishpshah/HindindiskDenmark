import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Phone, MapPin, Package } from "lucide-react";
import { toast } from "sonner";
import { useAdminOrders, type AdminOrderDto } from "@/hooks/useAdminOrders";
import { useUpdateOrderStatus } from "@/hooks/useUpdateOrderStatus";
import { useBranches } from "@/hooks/useBranches";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DataTable, StatusBadge, type ColumnDef } from "@/components/ui/data-table";

export const Route = createFileRoute("/admin/orders")({ component: AdminOrders });

const ORDER_STATUSES = ["Placed", "Accepted", "Preparing", "Ready", "OutForDelivery", "Completed", "Cancelled"];

const STATUS_LABELS: Record<string, string> = { OutForDelivery: "Out For Delivery" };

const STATUS_COLORS: Record<string, string> = {
  Placed:         "bg-blue-100 text-blue-700",
  Accepted:       "bg-indigo-100 text-indigo-700",
  Preparing:      "bg-amber-100 text-amber-700",
  Ready:          "bg-cyan-100 text-cyan-700",
  OutForDelivery: "bg-purple-100 text-purple-700",
  Completed:      "bg-green-100 text-green-700",
  Cancelled:      "bg-red-100 text-red-700",
};

// B1 fixed: hook removed from child; isUpdating passed from parent
function OrderExpandedRow({
  order,
  onStatusChange,
  isUpdating,
}: {
  order: AdminOrderDto;
  onStatusChange: (id: number, s: string) => void;
  isUpdating: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3 text-sm">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</p>
          <p className="font-medium">{order.contactName}</p>
          <p className="flex items-center gap-1.5 text-muted-foreground">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <a href={`tel:${order.contactPhone}`} className="hover:text-primary">{order.contactPhone}</a>
          </p>
          {order.contactEmail && <p className="text-muted-foreground text-xs">{order.contactEmail}</p>}
        </div>
        {order.orderType === "Delivery" && order.deliveryAddress && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Delivery Address</p>
            <p className="flex items-start gap-1.5 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />{order.deliveryAddress}
            </p>
          </div>
        )}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment</p>
          <p className="text-muted-foreground">{order.paymentMethod.replace(/([A-Z])/g, " $1").trim()}</p>
          {order.couponCode && (
            <code className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{order.couponCode}</code>
          )}
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Update Status</p>
          <Select
            value={order.status}
            onValueChange={s => onStatusChange(order.id, s)}
            disabled={isUpdating}
          >
            <SelectTrigger className="h-7 w-44 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ORDER_STATUSES.map(s => (
                <SelectItem key={s} value={s} className="text-xs">{STATUS_LABELS[s] ?? s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* W5 fixed: order items list */}
      {order.items && order.items.length > 0 && (
        <div className="border-t pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            <Package className="inline h-3.5 w-3.5 mr-1" />Items
          </p>
          <div className="space-y-1">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-1.5 text-sm">
                <span className="font-medium">{item.name}</span>
                <div className="flex items-center gap-4 text-muted-foreground text-xs">
                  <span>×{item.quantity}</span>
                  <span className="font-semibold text-foreground tabular-nums">{item.priceAtPurchase.toFixed(0)} DKK</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-end gap-6 text-xs text-muted-foreground border-t pt-2">
            <span>Subtotal <strong className="text-foreground">{order.subtotal.toFixed(0)} DKK</strong></span>
            {order.deliveryFee > 0 && <span>Delivery <strong className="text-foreground">{order.deliveryFee.toFixed(0)} DKK</strong></span>}
            {order.discount > 0 && <span>Discount <strong className="text-green-600">−{order.discount.toFixed(0)} DKK</strong></span>}
            <span>Total <strong className="text-foreground text-sm">{order.total.toFixed(0)} DKK</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminOrders() {
  const [filterStatus,   setFilterStatus]   = useState<string | undefined>();
  const [filterBranchId, setFilterBranchId] = useState<number | undefined>();

  const { data: orders = [], isLoading, refetch } = useAdminOrders({ status: filterStatus, branchId: filterBranchId });
  const { data: branches = [] } = useBranches();
  const updateStatus = useUpdateOrderStatus();

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(`Order #${id} → ${STATUS_LABELS[status] ?? status}`);
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Failed to update status.");
    }
  };

  const columns: ColumnDef<AdminOrderDto, unknown>[] = [
    {
      id: "customer",
      header: "Customer",
      accessorFn: row => `${row.customerName} ${row.customerEmail}`,
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.customerName}</div>
          <div className="text-xs text-muted-foreground">{row.original.customerEmail}</div>
        </div>
      ),
    },
    {
      accessorKey: "branchName",
      header: "Branch",
      cell: info => info.getValue<string>().replace("Hind Indisk ", ""),
    },
    {
      accessorKey: "orderType",
      header: "Type",
    },
    {
      accessorKey: "itemCount",
      header: "Items",
      cell: info => <span className="tabular-nums">{info.getValue<number>()}</span>,
    },
    {
      accessorKey: "total",
      header: "Total (DKK)",
      cell: info => <span className="font-semibold tabular-nums">{info.getValue<number>()} DKK</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: info => (
        <StatusBadge
          value={info.getValue<string>()}
          colorMap={STATUS_COLORS}
          labelMap={STATUS_LABELS}
        />
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: info => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {new Date(info.getValue<string>()).toLocaleDateString("da-DK", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit",
          })}
        </span>
      ),
    },
  ];

  const toolbar = (
    <>
      <Select value={filterStatus ?? "__all"} onValueChange={v => setFilterStatus(v === "__all" ? undefined : v)}>
        <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="All statuses" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="__all" className="text-xs">All statuses</SelectItem>
          {ORDER_STATUSES.map(s => (
            <SelectItem key={s} value={s} className="text-xs">{STATUS_LABELS[s] ?? s}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={filterBranchId?.toString() ?? "__all"} onValueChange={v => setFilterBranchId(v === "__all" ? undefined : Number(v))}>
        <SelectTrigger className="h-8 w-48 text-xs"><SelectValue placeholder="All branches" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="__all" className="text-xs">All branches</SelectItem>
          {branches.map(b => (
            <SelectItem key={b.id} value={String(b.id)} className="text-xs">{b.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold">Orders</h1>
      <DataTable
        title="Orders"
        columns={columns}
        data={orders}
        isLoading={isLoading}
        toolbar={toolbar}
        onRefresh={refetch}
        getRowId={row => String(row.id)}
        expandedRow={row => (
          <OrderExpandedRow
            order={row.original}
            onStatusChange={handleStatusChange}
            isUpdating={updateStatus.isPending}
          />
        )}
      />
    </div>
  );
}
