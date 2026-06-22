import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, Leaf } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAdminMenuItems, type AdminMenuItemDto } from "@/hooks/useAdminMenuItems";
import { useDeleteMenuItem } from "@/hooks/useDeleteMenuItem";
import { useBranches } from "@/hooks/useBranches";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DataTable, ActionButtons, type ColumnDef, type Row } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { MenuItemPhoto } from "@/components/MenuItemPhoto";

export const Route = createFileRoute("/admin/menu/")({ component: AdminMenuIndex });

const SPICY_OPTIONS = [
  { value: 0, label: "None",   color: "bg-green-50 text-green-700"   },
  { value: 1, label: "Mild",   color: "bg-yellow-50 text-yellow-700" },
  { value: 2, label: "Medium", color: "bg-orange-50 text-orange-700" },
  { value: 3, label: "Hot",    color: "bg-red-50 text-red-700"       },
];

function SpicyBadge({ level }: { level: number }) {
  const opt = SPICY_OPTIONS[level] ?? SPICY_OPTIONS[0];
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${opt.color}`}>{opt.label}</span>;
}

function PriceBreakdown({ item }: { item: AdminMenuItemDto }) {
  return (
    <div className="flex flex-wrap gap-2">
      {item.prices.map(bp => (
        <div key={bp.branchId} className="rounded-lg border bg-card px-3 py-1.5 text-xs">
          <span className="font-medium">{bp.branchName.replace("Hind Indisk ", "")}</span>
          <span className="ml-2 text-muted-foreground">{bp.price} DKK</span>
        </div>
      ))}
      {item.prices.length === 0 && <span className="text-sm text-muted-foreground">No prices set.</span>}
    </div>
  );
}

function AdminMenuIndex() {
  const navigate = useNavigate();
  const { data: items = [], isLoading, refetch } = useAdminMenuItems();
  const { data: branches = [] } = useBranches();
  const deleteItem = useDeleteMenuItem();

  const [pending,        setPending]        = useState<AdminMenuItemDto | null>(null);
  const [filterBranchId, setFilterBranchId] = useState<number | undefined>();

  const handleDelete = async () => {
    if (!pending) return;
    try {
      await deleteItem.mutateAsync(pending.id);
      toast.success("Item deleted.");
    } catch {
      toast.error("Failed to delete item.");
    } finally {
      setPending(null);
    }
  };

  // Client-side branch filter — item is at a branch if it has a price entry for that branch
  const filtered = filterBranchId
    ? items.filter(item => item.prices.some(p => p.branchId === filterBranchId))
    : items;

  const columns: ColumnDef<AdminMenuItemDto, unknown>[] = [
    {
      id: "item",
      header: "Item",
      accessorFn: row => row.name,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <MenuItemPhoto src={row.original.imageUrl} alt={row.original.name} className="h-10 w-10 rounded-lg object-cover shrink-0" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-medium">{row.original.name}</span>
              {row.original.isVegetarian && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
                  <Leaf className="h-2.5 w-2.5" />Veg
                </span>
              )}
            </div>
            <div className="max-w-xs truncate text-xs text-muted-foreground">{row.original.description}</div>
          </div>
        </div>
      ),
    },
    {
      id: "categories",
      header: "Menus",
      accessorFn: row => row.categories.join(", "),
      cell: info => <span className="text-xs text-muted-foreground">{info.getValue<string>() || "—"}</span>,
    },
    {
      // Branches column — derived from prices
      id: "branches",
      header: "Branches",
      accessorFn: row => row.prices.map(p => p.branchName).join(", "),
      cell: ({ row }) => {
        const ps = row.original.prices;
        if (ps.length === 0) return <span className="text-xs text-muted-foreground">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {ps.map(p => (
              <span key={p.branchId} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {p.branchName.replace("Hind Indisk ", "")}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "spicyLevel",
      header: "Spice",
      cell: info => <SpicyBadge level={info.getValue<number>()} />,
    },
    {
      id: "price",
      header: "Price",
      accessorFn: row => row.prices.length > 0 ? Math.min(...row.prices.map(p => p.price)) : null,
      cell: ({ row }) => {
        const ps = row.original.prices;
        if (ps.length === 0) return <span className="text-xs text-muted-foreground">—</span>;
        const min = Math.min(...ps.map(p => p.price));
        const max = Math.max(...ps.map(p => p.price));
        return (
          <span className="tabular-nums text-sm font-medium">
            {min === max ? `${min} DKK` : `${min}–${max} DKK`}
          </span>
        );
      },
    },
    {
      id: "__actions",
      header: "Actions",
      enableSorting: false,
      enableColumnFilter: false,
      cell: ({ row }) => (
        <ActionButtons
          onEdit={() => navigate({ to: "/admin/menu/$itemId", params: { itemId: String(row.original.id) } })}
          onDelete={() => setPending(row.original)}
          deleteDisabled={deleteItem.isPending}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold">Menu Items</h1>
      <DataTable
        title="Menu Items"
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
              onClick={() => navigate({ to: "/admin/menu/new" })}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> New Item
            </Button>
          </>
        }
        onRefresh={refetch}
        expandedRow={(row: Row<AdminMenuItemDto>) => <PriceBreakdown item={row.original} />}
      />

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={open => { if (!open) setPending(null); }}
        title="Delete item?"
        description={pending ? `"${pending.name}" will be permanently deleted. This cannot be undone.` : ""}
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
