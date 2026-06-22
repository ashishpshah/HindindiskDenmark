import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAdminMenus, type AdminMenuDto } from "@/hooks/useAdminMenus";
import { useDeleteMenu } from "@/hooks/useDeleteMenu";
import { useToggleMenu } from "@/hooks/useToggleMenu";
import { useBranches } from "@/hooks/useBranches";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DataTable, ActionButtons, type ColumnDef } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { InlineStatusSelect } from "@/components/admin/InlineStatusSelect";

export const Route = createFileRoute("/admin/menus/")({ component: AdminMenusIndex });

function AdminMenusIndex() {
  const navigate = useNavigate();
  const { data: menus = [], isLoading, refetch } = useAdminMenus();
  const { data: branches = [] } = useBranches();
  const deleteMenu = useDeleteMenu();
  const toggleMenu = useToggleMenu();
  const [pending,        setPending]        = useState<AdminMenuDto | null>(null);
  const [filterBranchId, setFilterBranchId] = useState<number | undefined>();

  const handleDelete = async () => {
    if (!pending) return;
    try {
      await deleteMenu.mutateAsync(pending.id);
      toast.success("Menu deleted.");
    } catch {
      toast.error("Failed to delete menu.");
    } finally {
      setPending(null);
    }
  };

  // Client-side branch filter
  const filtered = filterBranchId
    ? menus.filter(m => m.branchIds.includes(filterBranchId))
    : menus;

  const columns: ColumnDef<AdminMenuDto, unknown>[] = [
    {
      accessorKey: "name",
      header: "Menu Name",
      cell: ({ row }) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{row.original.name}</span>
            {row.original.nameDa && (
              <span className="rounded-sm bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 leading-none">DA</span>
            )}
          </div>
          {row.original.description && (
            <div className="text-xs text-muted-foreground">{row.original.description}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "itemCount",
      header: "Items",
      cell: info => (
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary tabular-nums">
          {info.getValue<number>()}
        </span>
      ),
    },
    {
      // Branches column
      id: "branches",
      header: "Branches",
      accessorFn: row => row.branchIds.length,
      cell: ({ row }) => {
        const ids = row.original.branchIds;
        if (ids.length === 0) return <span className="text-xs text-muted-foreground">—</span>;
        const names = ids.map(id => {
          const b = branches.find(x => x.id === id);
          return b ? b.name.replace("Hind Indisk ", "") : `#${id}`;
        });
        return (
          <div className="flex flex-wrap gap-1">
            {names.map(n => (
              <span key={n} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{n}</span>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <InlineStatusSelect
          active={row.original.isActive}
          disabled={toggleMenu.isPending}
          onToggle={() => {
            toggleMenu.mutate(row.original.id, {
              onSuccess: () => toast.success(`Menu ${row.original.isActive ? "deactivated" : "activated"}.`),
              onError:   () => toast.error("Failed to update status."),
            });
          }}
        />
      ),
    },
    {
      id: "__actions",
      header: "Actions",
      enableSorting: false,
      enableColumnFilter: false,
      cell: ({ row }) => (
        <ActionButtons
          onEdit={() => navigate({ to: "/admin/menus/$menuId", params: { menuId: String(row.original.id) } })}
          onDelete={() => setPending(row.original)}
          deleteDisabled={deleteMenu.isPending}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold">Menus</h1>
      <DataTable
        title="Menus"
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        getRowId={row => String(row.id)}
        toolbar={
          <>
            {/* Branch filter */}
            <Select value={filterBranchId?.toString() ?? "__all"}
              onValueChange={v => setFilterBranchId(v === "__all" ? undefined : Number(v))}>
              <SelectTrigger className="h-8 w-48 text-xs"><SelectValue placeholder="All branches" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all" className="text-xs">All branches</SelectItem>
                {branches.map(b => (
                  <SelectItem key={b.id} value={String(b.id)} className="text-xs">
                    {b.name.replace("Hind Indisk ", "")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" className="gradient-primary text-primary-foreground h-8"
              onClick={() => navigate({ to: "/admin/menus/new" })}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> New Menu
            </Button>
          </>
        }
        onRefresh={refetch}
      />

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={open => { if (!open) setPending(null); }}
        title="Delete menu?"
        description={pending ? `"${pending.name}" will be deleted. Linked items will not be affected.` : ""}
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
