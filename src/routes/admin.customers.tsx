import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { useAdminCustomers, useAdminCustomerDetail, type AdminCustomerDto } from "@/hooks/useAdminCustomers";
import { DataTable, type ColumnDef, type Row } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/customers")({ component: AdminCustomers });

const ORDER_STATUS_COLORS: Record<string, string> = {
  Completed:  "bg-green-100 text-green-700",
  Cancelled:  "bg-red-100 text-red-700",
  Preparing:  "bg-amber-100 text-amber-700",
};

function CustomerExpandedRow({ customerId }: { customerId: number }) {
  const { data: detail, isLoading } = useAdminCustomerDetail(customerId);
  if (isLoading) return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" /> Loading orders…
    </div>
  );
  if (!detail || detail.orders.length === 0) return (
    <p className="text-xs text-muted-foreground">No orders yet.</p>
  );
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Order History</p>
      {detail.orders.map(o => (
        <div key={o.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-2 text-sm">
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-muted-foreground">#{o.id}</span>
            <span className="text-muted-foreground">{o.branchName.replace("Hind Indisk ", "")}</span>
            <span className="text-muted-foreground">{o.orderType}</span>
            <span className="text-xs text-muted-foreground">{o.itemCount} item{o.itemCount !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ORDER_STATUS_COLORS[o.status] ?? "bg-blue-100 text-blue-700"}`}>
              {o.status}
            </span>
            <span className="font-semibold">{o.total.toFixed(0)} DKK</span>
            {/* B6 fixed: da-DK locale */}
            <span className="text-xs text-muted-foreground">
              {new Date(o.createdAt).toLocaleDateString("da-DK", { day: "2-digit", month: "short" })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminCustomers() {
  // F2 fixed: server-side search wired to useAdminCustomers(q)
  const [q, setQ] = useState("");
  const { data: customers = [], isLoading, refetch } = useAdminCustomers(q || undefined);

  const columns: ColumnDef<AdminCustomerDto, unknown>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: info => <span className="font-medium">{info.getValue<string>()}</span>,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: info => <span className="text-muted-foreground">{info.getValue<string>()}</span>,
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: info => <span className="text-muted-foreground">{info.getValue<string>() || "—"}</span>,
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
      // B6 fixed: da-DK locale
      cell: info => (
        <span className="text-xs text-muted-foreground">
          {new Date(info.getValue<string>()).toLocaleDateString("da-DK", { day: "2-digit", month: "short", year: "numeric" })}
        </span>
      ),
    },
    {
      accessorKey: "orderCount",
      header: "Orders",
      cell: info => <span className="tabular-nums">{info.getValue<number>()}</span>,
    },
    {
      accessorKey: "reservationCount",
      header: "Reservations",
      cell: info => <span className="tabular-nums">{info.getValue<number>()}</span>,
    },
    {
      accessorKey: "totalSpend",
      header: "Total Spend",
      cell: info => (
        <span className="font-semibold tabular-nums text-primary">
          {info.getValue<number>().toFixed(0)} DKK
        </span>
      ),
    },
    // W1 fixed: removed always-active Status column (no real isActive field in DTO)
  ];

  const toolbar = (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
      <Input
        placeholder="Search customers…"
        value={q}
        onChange={e => setQ(e.target.value)}
        className="pl-8 h-8 w-52 text-sm"
      />
    </div>
  );

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold">Customers</h1>
      <DataTable
        title="Customers"
        columns={columns}
        data={customers}
        isLoading={isLoading}
        getRowId={row => String(row.id)}
        toolbar={toolbar}
        onRefresh={refetch}
        expandedRow={(row: Row<AdminCustomerDto>) => (
          <CustomerExpandedRow customerId={row.original.id} />
        )}
      />
    </div>
  );
}
