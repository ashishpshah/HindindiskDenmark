import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAdminOffers, type AdminOfferDto } from "@/hooks/useAdminOffers";
import { useToggleOffer } from "@/hooks/useToggleOffer";
import { useDeleteOffer } from "@/hooks/useDeleteOffer";
import { Button } from "@/components/ui/button";
import { DataTable, ActionButtons, type ColumnDef } from "@/components/ui/data-table";
import { InlineStatusSelect } from "@/components/admin/InlineStatusSelect";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

export const Route = createFileRoute("/admin/offers/")({ component: AdminOffersIndex });

// P3 — friendly discount type labels
const DISCOUNT_TYPE_LABELS: Record<string, string> = {
  Percent:      "% Off",
  FixedAmount:  "Fixed",
  FreeShipping: "Free Delivery",
};

function discountLabel(o: AdminOfferDto) {
  if (o.discountType === "Percent")      return `${o.discountValue}% off`;
  if (o.discountType === "FreeShipping") return "Free delivery";
  return `${o.discountValue} DKK off`;
}

function AdminOffersIndex() {
  const navigate    = useNavigate();
  const { data: offers = [], isLoading, refetch } = useAdminOffers();
  const toggleOffer = useToggleOffer();
  const deleteOffer = useDeleteOffer();
  const [pending, setPending] = useState<AdminOfferDto | null>(null);

  const handleDelete = async () => {
    if (!pending) return;
    try {
      await deleteOffer.mutateAsync(pending.id);
      toast.success("Offer deleted.");
    } catch {
      toast.error("Failed to delete offer.");
    } finally {
      setPending(null);
    }
  };

  const columns: ColumnDef<AdminOfferDto, unknown>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.title}</div>
          {row.original.couponCode && (
            <code className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {row.original.couponCode}
            </code>
          )}
        </div>
      ),
    },
    {
      accessorKey: "discountType",
      header: "Type",
      // P3 — friendly label
      cell: info => DISCOUNT_TYPE_LABELS[info.getValue<string>()] ?? info.getValue<string>(),
    },
    {
      id: "discount",
      header: "Discount",
      accessorFn: row => discountLabel(row),
      cell: info => <span className="font-medium">{info.getValue<string>()}</span>,
    },
    {
      id: "usage",
      header: "Used",
      accessorFn: row => row.usageCount,
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">
          {row.original.usageCount}
          {row.original.usageLimit ? `/${row.original.usageLimit}` : ""}
        </span>
      ),
    },
    {
      id: "dates",
      header: "Valid",
      accessorFn: row => `${row.startDate} – ${row.endDate}`,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {/* B6 fixed: da-DK locale */}
          {new Date(row.original.startDate).toLocaleDateString("da-DK", { day: "2-digit", month: "short", year: "numeric" })}
          {" – "}
          {new Date(row.original.endDate).toLocaleDateString("da-DK", { day: "2-digit", month: "short", year: "numeric" })}
        </span>
      ),
    },
    {
      accessorKey: "isFirstOrderOnly",
      header: "First Order",
      cell: info => info.getValue<boolean>()
        ? <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700"><Star className="h-3 w-3" />Yes</span>
        : <span className="text-xs text-muted-foreground">—</span>,
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        // B3 fixed: toast fires inside callbacks, W4 fixed: onToggle
        <InlineStatusSelect
          active={row.original.isActive}
          disabled={toggleOffer.isPending}
          onToggle={() => {
            toggleOffer.mutate(row.original.id, {
              onSuccess: () => toast.success(`Offer ${row.original.isActive ? "deactivated" : "activated"}.`),
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
        // F1 fixed: delete action added
        <ActionButtons
          onEdit={() => navigate({ to: "/admin/offers/$offerId", params: { offerId: String(row.original.id) } })}
          onDelete={() => setPending(row.original)}
          deleteDisabled={deleteOffer.isPending}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold">Offers &amp; Coupons</h1>
      <DataTable
        title="Offers"
        columns={columns}
        data={offers}
        isLoading={isLoading}
        getRowId={row => String(row.id)}
        toolbar={
          <Button size="sm" className="gradient-primary text-primary-foreground h-8"
            onClick={() => navigate({ to: "/admin/offers/new" })}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> New Offer
          </Button>
        }
        onRefresh={refetch}
      />

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={open => { if (!open) setPending(null); }}
        title="Delete offer?"
        description={pending ? `"${pending.title}" will be permanently deleted.` : ""}
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
