import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useAdminBranches } from "@/hooks/useAdminBranches";
import type { AdminBranchDto } from "@/hooks/useUpdateBranch";
import { Button } from "@/components/ui/button";
import { DataTable, ActionButtons, type ColumnDef } from "@/components/ui/data-table";

export const Route = createFileRoute("/admin/branches/")({ component: AdminBranchesIndex });

function AdminBranchesIndex() {
  const navigate = useNavigate();
  const { data: branches = [], isLoading, refetch } = useAdminBranches();

  const columns: ColumnDef<AdminBranchDto, unknown>[] = [
    {
      accessorKey: "name",
      header: "Branch Name",
      cell: info => <span className="font-medium">{info.getValue<string>()}</span>,
    },
    {
      accessorKey: "city",
      header: "City",
    },
    {
      accessorKey: "addressLine1",
      header: "Address",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.addressLine1}{row.original.addressLine2 ? `, ${row.original.addressLine2}` : ""}
          {", "}{row.original.postalCode}
        </span>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: info => <span className="text-muted-foreground">{info.getValue<string>()}</span>,
    },
    {
      id: "weekday",
      header: "Weekday Hours",
      accessorFn: row => `${row.weekdayOpen} – ${row.weekdayClose}`,
      cell: info => <span className="text-sm text-muted-foreground">{info.getValue<string>()}</span>,
    },
    {
      id: "weekend",
      header: "Weekend Hours",
      accessorFn: row => `${row.weekendOpen} – ${row.weekendClose}`,
      cell: info => <span className="text-sm text-muted-foreground">{info.getValue<string>()}</span>,
    },
    // W2 fixed: removed always-active Status column (no real isActive on branch DTO)
    {
      id: "__actions",
      header: "Actions",
      enableSorting: false,
      enableColumnFilter: false,
      // P2 fixed: use ActionButtons instead of raw <button>
      cell: ({ row }) => (
        <ActionButtons
          onEdit={() => navigate({ to: "/admin/branches/$branchId", params: { branchId: String(row.original.id) } })}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold">Branches</h1>
      <DataTable
        title="Branches"
        columns={columns}
        data={branches}
        isLoading={isLoading}
        getRowId={row => String(row.id)}
        toolbar={
          <Button size="sm" className="gradient-primary text-primary-foreground h-8"
            onClick={() => navigate({ to: "/admin/branches/new" })}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Branch
          </Button>
        }
        onRefresh={refetch}
      />
    </div>
  );
}
