import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Pencil, RefreshCcw, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { useAdminMenuItems, type AdminMenuItemDto } from "@/hooks/useAdminMenuItems";
import { useUpdateMenuItem } from "@/hooks/useUpdateMenuItem";
import { useUpdateMenuItemPrices } from "@/hooks/useUpdateMenuItemPrices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/menu")({
  component: AdminMenu,
});

const SPICY_LABELS = ["None", "Mild", "Medium", "Hot"];

function AdminMenu() {
  const { data: items = [], isLoading, refetch } = useAdminMenuItems();
  const updateItem    = useUpdateMenuItem();
  const updatePrices  = useUpdateMenuItemPrices();

  const [editing, setEditing]   = useState<AdminMenuItemDto | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [form, setForm]         = useState({ name: "", description: "", imageUrl: "", spicyLevel: 0 });
  const [prices, setPrices]     = useState<Record<number, string>>({});

  const openEdit = (item: AdminMenuItemDto) => {
    setEditing(item);
    setForm({ name: item.name, description: item.description, imageUrl: item.imageUrl, spicyLevel: item.spicyLevel });
    const p: Record<number, string> = {};
    item.prices.forEach((bp) => { p[bp.branchId] = String(bp.price); });
    setPrices(p);
  };

  const handleSave = async () => {
    if (!editing) return;
    try {
      await updateItem.mutateAsync({ id: editing.id, ...form });
      const pricePayload = Object.entries(prices).map(([branchId, price]) => ({
        branchId: Number(branchId),
        price: Number(price),
      }));
      await updatePrices.mutateAsync({ id: editing.id, prices: pricePayload });
      toast.success("Menu item updated.");
      setEditing(null);
    } catch {
      toast.error("Failed to save.");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold">Menu Items</h1>
        <button onClick={() => refetch()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition">
          <RefreshCcw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-10">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading menu items…
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                {["", "Name", "Category", "Spice", "Labels", "Prices", ""].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item) => (
                <>
                  <tr key={item.id} className="hover:bg-muted/30 transition">
                    <td className="px-4 py-3">
                      <img src={item.imageUrl} alt={item.name} className="h-10 w-10 rounded-lg object-cover" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{item.name}</div>
                      <div className="max-w-xs truncate text-xs text-muted-foreground">{item.description}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{item.categories.join(", ")}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${
                        item.spicyLevel === 0 ? "bg-green-50 text-green-700" :
                        item.spicyLevel === 1 ? "bg-yellow-50 text-yellow-700" :
                        item.spicyLevel === 2 ? "bg-orange-50 text-orange-700" :
                        "bg-red-50 text-red-700"
                      }`}>
                        {SPICY_LABELS[item.spicyLevel]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{item.labels.join(", ") || "—"}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                      >
                        {item.prices.length} branch{item.prices.length !== 1 ? "es" : ""}
                        {expanded === item.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="outline" onClick={() => openEdit(item)}>
                        <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                      </Button>
                    </td>
                  </tr>
                  {expanded === item.id && (
                    <tr key={`${item.id}-prices`} className="bg-muted/20">
                      <td colSpan={7} className="px-8 py-3">
                        <div className="flex flex-wrap gap-4 text-xs">
                          {item.prices.map((bp) => (
                            <div key={bp.branchId} className="rounded-lg border bg-card px-3 py-1.5">
                              <span className="font-medium">{bp.branchName.replace("Hind Indisk ", "")}</span>
                              <span className="ml-2 text-muted-foreground">{bp.price} DKK</span>
                            </div>
                          ))}
                          {item.prices.length === 0 && <span className="text-muted-foreground">No prices set</span>}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit — {editing?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Image URL</Label>
              <Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Spicy Level (0 = None, 3 = Hot)</Label>
              <Input
                type="number" min={0} max={3}
                value={form.spicyLevel}
                onChange={(e) => setForm({ ...form, spicyLevel: Number(e.target.value) })}
              />
            </div>

            {editing && editing.prices.length > 0 && (
              <div className="space-y-2">
                <Label>Branch Prices (DKK)</Label>
                {editing.prices.map((bp) => (
                  <div key={bp.branchId} className="flex items-center gap-2">
                    <span className="w-44 truncate text-sm text-muted-foreground">
                      {bp.branchName.replace("Hind Indisk ", "")}
                    </span>
                    <Input
                      type="number" min={0} step={0.01} className="w-28"
                      value={prices[bp.branchId] ?? ""}
                      onChange={(e) => setPrices({ ...prices, [bp.branchId]: e.target.value })}
                    />
                    <span className="text-sm text-muted-foreground">DKK</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button
              className="gradient-primary text-primary-foreground"
              disabled={updateItem.isPending || updatePrices.isPending}
              onClick={handleSave}
            >
              {(updateItem.isPending || updatePrices.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
