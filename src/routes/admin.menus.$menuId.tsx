import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Loader2, Check, Plus, Trash2,
  ChevronUp, ChevronDown, Search, Flame,
} from "lucide-react";
import { toast } from "sonner";
import { useAdminMenus, type AdminMenuItemSummary } from "@/hooks/useAdminMenus";
import { useAdminMenuItems } from "@/hooks/useAdminMenuItems";
import { useUpdateMenu } from "@/hooks/useUpdateMenu";
import { useAddItemToMenu } from "@/hooks/useAddItemToMenu";
import { useRemoveItemFromMenu } from "@/hooks/useRemoveItemFromMenu";
import { useReorderMenuItems } from "@/hooks/useReorderMenuItems";
import { useBranches } from "@/hooks/useBranches";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormPage } from "@/components/admin/FormPage";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { BranchMultiSelect } from "@/components/admin/BranchMultiSelect";

export const Route = createFileRoute("/admin/menus/$menuId")({ component: MenuEditPage });

const SPICY_LABELS = ["", "Mild", "Medium", "Hot"];

function SpicyDots({ level }: { level: number }) {
  if (!level) return null;
  return (
    <span className="flex items-center gap-0.5 text-orange-500" title={SPICY_LABELS[level]}>
      {Array.from({ length: level }).map((_, i) => (
        <Flame key={i} className="h-3 w-3 fill-orange-500" />
      ))}
    </span>
  );
}

function MenuEditPage() {
  const navigate   = useNavigate();
  const { menuId } = Route.useParams();

  const { data: menus = [], isLoading } = useAdminMenus();
  const { data: allItems = [] }         = useAdminMenuItems();
  const { data: branches = [] }         = useBranches();

  const updateMenu  = useUpdateMenu();
  const addItem     = useAddItemToMenu();
  const removeItem  = useRemoveItemFromMenu();
  const reorder     = useReorderMenuItems();

  const menu = menus.find(m => String(m.id) === menuId);

  // ── form fields ──────────────────────────────────────────────────────────
  const [name,      setName]      = useState("");
  const [nameDa,    setNameDa]    = useState("");
  const [desc,      setDesc]      = useState("");
  const [descDa,    setDescDa]    = useState("");
  const [branchIds, setBranchIds] = useState<number[]>([]);

  // ── ordered items (optimistic local state) ────────────────────────────
  const [sortedItems, setSortedItems] = useState<AdminMenuItemSummary[]>([]);

  // ── picker ───────────────────────────────────────────────────────────
  const [showPicker,   setShowPicker]   = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");

  // ── confirms ─────────────────────────────────────────────────────────
  const [pendingUnlink, setPendingUnlink] = useState<AdminMenuItemSummary | null>(null);

  useEffect(() => {
    if (menu) {
      setName(menu.name);
      setNameDa(menu.nameDa ?? "");
      setDesc(menu.description);
      setDescDa(menu.descriptionDa ?? "");
      setBranchIds(menu.branchIds ?? []);
      setSortedItems([...menu.items].sort((a, b) => a.sortOrder - b.sortOrder));
    }
  }, [menu]);

  if (isLoading) return (
    <div className="flex items-center gap-2 text-muted-foreground py-16">
      <Loader2 className="h-5 w-5 animate-spin" /> Loading…
    </div>
  );

  if (!menu) return (
    <div className="py-16 text-center text-muted-foreground">Menu not found.</div>
  );

  // ── handlers ─────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      await updateMenu.mutateAsync({
        id:            menu.id,
        name:          name.trim(),
        nameDa:        nameDa.trim(),
        description:   desc.trim(),
        descriptionDa: descDa.trim(),
        branchIds,
      });
      toast.success("Menu updated.");
      navigate({ to: "/admin/menus" });
    } catch { toast.error("Failed to update menu."); }
  };

  const moveItem = (index: number, dir: "up" | "down") => {
    const next = [...sortedItems];
    const swap = dir === "up" ? index - 1 : index + 1;
    [next[index], next[swap]] = [next[swap], next[index]];
    setSortedItems(next);
    reorder.mutate({
      menuId: menu.id,
      items: next.map((item, i) => ({ itemId: item.id, sortOrder: i + 1 })),
    });
  };

  const handleAddItem = async (itemId: number) => {
    try {
      await addItem.mutateAsync({ menuId: menu.id, itemId });
      setPickerSearch("");
      toast.success("Item added to menu.");
    } catch { toast.error("Failed to add item."); }
  };

  const handleUnlink = async () => {
    if (!pendingUnlink) return;
    try {
      await removeItem.mutateAsync({ menuId: menu.id, itemId: pendingUnlink.id });
      toast.success("Item unlinked from this menu.");
    } catch { toast.error("Failed to unlink item."); }
    finally { setPendingUnlink(null); }
  };

  const linkedIds = new Set(menu.items.map(i => i.id));
  const available = allItems.filter(i =>
    !linkedIds.has(i.id) &&
    (pickerSearch.trim() === "" || i.name.toLowerCase().includes(pickerSearch.toLowerCase()))
  );

  return (
    <FormPage
      title={`Edit — ${menu.name}`}
      subtitle="Update menu name, description and manage linked items"
      backTo="/admin/menus"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* ── Basic fields ─────────────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input autoFocus value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSave()} />
          </div>
          <div className="space-y-1.5">
            <Label>Name <span className="text-xs text-muted-foreground">(Danish)</span></Label>
            <Input placeholder="Dansk navn" value={nameDa} onChange={e => setNameDa(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description </Label>
            <Input value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description <span className="text-xs text-muted-foreground">(Danish)</span></Label>
            <Input placeholder="Dansk beskrivelse" value={descDa} onChange={e => setDescDa(e.target.value)} />
          </div>
        </div>

        {/* ── Branch selection ─────────────────────────────────────────── */}
        <div className="border-t pt-4">
          <BranchMultiSelect
            branches={branches}
            selected={branchIds}
            onChange={setBranchIds}
            label="Available at Branches"
          />
        </div>

        {/* ── Items section ────────────────────────────────────────────── */}
        <div className="space-y-3 border-t pt-5">
          <div className="flex items-center justify-between">
            <Label className="text-base">
              Items
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                ({sortedItems.length})
              </span>
            </Label>
            <div className="flex gap-2">
              <Button
                size="sm" variant="outline" className="h-8"
                onClick={() => navigate({ to: "/admin/menu/new" })}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Item
              </Button>
              <Button
                size="sm" variant="outline" className="h-8"
                onClick={() => { setShowPicker(v => !v); setPickerSearch(""); }}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                {showPicker ? "Close Picker" : "Add Existing"}
              </Button>
            </div>
          </div>

          {/* Add-existing picker */}
          {showPicker && (
            <div className="rounded-xl border bg-muted/20 p-3 space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  autoFocus placeholder="Search items to add…"
                  value={pickerSearch} onChange={e => setPickerSearch(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
              {available.length === 0 ? (
                <p className="text-xs text-muted-foreground px-1">
                  {pickerSearch ? "No matches." : "All items already linked."}
                </p>
              ) : (
                <div className="max-h-40 overflow-y-auto divide-y">
                  {available.map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleAddItem(item.id)}
                      disabled={addItem.isPending}
                      className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-accent transition rounded"
                    >
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt={item.name}
                          className="h-6 w-6 rounded object-cover shrink-0" />
                      )}
                      <span className="flex-1 truncate">{item.name}</span>
                      <SpicyDots level={item.spicyLevel} />
                      <Plus className="h-3.5 w-3.5 text-primary shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Items list */}
          {sortedItems.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center border rounded-xl">
              No items linked yet. Use the buttons above to add items.
            </p>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 text-xs text-muted-foreground">
                    <th className="px-3 py-2 text-left w-10">#</th>
                    <th className="px-3 py-2 text-left">Item</th>
                    <th className="px-3 py-2 text-right">Price</th>
                    <th className="px-3 py-2 text-center">Spice</th>
                    <th className="px-3 py-2 text-center w-36">Order</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sortedItems.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-muted/20 transition">
                      {/* Sort position */}
                      <td className="px-3 py-2 text-muted-foreground tabular-nums">{idx + 1}</td>

                      {/* Name */}
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {item.imageUrl && (
                            <img src={item.imageUrl} alt={item.name}
                              className="h-8 w-8 rounded object-cover shrink-0" />
                          )}
                          <span className="font-medium">{item.name}</span>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                        {item.price != null ? `${item.price} DKK` : "—"}
                      </td>

                      {/* Spice */}
                      <td className="px-3 py-2 text-center">
                        <SpicyDots level={
                          allItems.find(i => i.id === item.id)?.spicyLevel ?? 0
                        } />
                      </td>

                      {/* Up / Down */}
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => moveItem(idx, "up")}
                            disabled={idx === 0 || reorder.isPending}
                            className="rounded p-1 text-muted-foreground hover:bg-accent disabled:opacity-30 transition"
                            title="Move up"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => moveItem(idx, "down")}
                            disabled={idx === sortedItems.length - 1 || reorder.isPending}
                            className="rounded p-1 text-muted-foreground hover:bg-accent disabled:opacity-30 transition"
                            title="Move down"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </div>
                      </td>

                      {/* Actions: Unlink from this menu */}
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => setPendingUnlink(item)}
                            className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
                            title="Unlink from this menu only"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Save / Cancel ────────────────────────────────────────────── */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            className="gradient-primary text-primary-foreground"
            disabled={!name.trim() || updateMenu.isPending}
            onClick={handleSave}
          >
            {updateMenu.isPending
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <Check className="mr-1.5 h-4 w-4" />}
            Save Changes
          </Button>
          <Button variant="outline" onClick={() => navigate({ to: "/admin/menus" })}>
            Cancel
          </Button>
        </div>
      </div>

      {/* ── Confirm: Unlink from this menu ───────────────────────────── */}
      <ConfirmDialog
        open={pendingUnlink !== null}
        onOpenChange={open => { if (!open) setPendingUnlink(null); }}
        title="Unlink item?"
        description={
          pendingUnlink
            ? `"${pendingUnlink.name}" will be removed from this menu only. The item will still exist in other menus.`
            : ""
        }
        confirmLabel="Unlink"
        onConfirm={handleUnlink}
      />
    </FormPage>
  );
}
