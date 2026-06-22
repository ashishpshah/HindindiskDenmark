import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { useAdminMenuItems } from "@/hooks/useAdminMenuItems";
import { useAdminMenus } from "@/hooks/useAdminMenus";
import { useBranches } from "@/hooks/useBranches";
import { useUpdateMenuItem } from "@/hooks/useUpdateMenuItem";
import { useUpdateMenuItemPrices } from "@/hooks/useUpdateMenuItemPrices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormPage } from "@/components/admin/FormPage";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { BranchMultiSelect } from "@/components/admin/BranchMultiSelect";

export const Route = createFileRoute("/admin/menu/$itemId")({ component: MenuItemEditPage });

const SPICY_OPTIONS = [
  { value: 0, label: "None" }, { value: 1, label: "Mild" },
  { value: 2, label: "Medium" }, { value: 3, label: "Hot" },
];

type PriceMap = Record<number, string>;

function MenuItemEditPage() {
  const navigate    = useNavigate();
  const { itemId }  = Route.useParams();

  const { data: items    = [], isLoading } = useAdminMenuItems();
  const { data: menus    = [] }            = useAdminMenus();
  const { data: branches = [] }            = useBranches();
  const updateItem   = useUpdateMenuItem();
  const updatePrices = useUpdateMenuItemPrices();

  const item = items.find(i => String(i.id) === itemId);

  const [name,              setName]              = useState("");
  const [nameDa,            setNameDa]            = useState("");
  const [desc,              setDesc]              = useState("");
  const [descDa,            setDescDa]            = useState("");
  const [imageUrl,          setImageUrl]          = useState("");
  const [spicyLevel,        setSpicyLevel]        = useState(0);
  const [menuIds,           setMenuIds]           = useState<number[]>([]);
  const [selectedBranchIds, setSelectedBranchIds] = useState<number[]>([]);
  const [prices,            setPrices]            = useState<PriceMap>({});

  useEffect(() => {
    if (!item) return;
    setName(item.name);
    setNameDa(item.nameDa ?? "");
    setDesc(item.description);
    setDescDa(item.descriptionDa ?? "");
    setImageUrl(item.imageUrl);
    setSpicyLevel(item.spicyLevel);
    setMenuIds(menus.filter(m => m.items.some(i => i.id === item.id)).map(m => m.id));
    // Pre-select branches that already have a price
    const existingBranchIds = item.prices.map(bp => bp.branchId);
    setSelectedBranchIds(existingBranchIds);
    const p: PriceMap = {};
    item.prices.forEach(bp => { p[bp.branchId] = String(bp.price); });
    setPrices(p);
  }, [item, menus]);

  const toggleMenu = (id: number) =>
    setMenuIds(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);

  const handleBranchChange = (ids: number[]) => {
    setSelectedBranchIds(ids);
    setPrices(prev => {
      const next: PriceMap = {};
      ids.forEach(id => { if (prev[id] !== undefined) next[id] = prev[id]; });
      return next;
    });
  };

  if (isLoading) return (
    <div className="flex items-center gap-2 text-muted-foreground py-16">
      <Loader2 className="h-5 w-5 animate-spin" /> Loading…
    </div>
  );

  if (!item) return <div className="py-16 text-center text-muted-foreground">Item not found.</div>;

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      await updateItem.mutateAsync({
        id:            item.id,
        name:          name.trim(),
        nameDa:        nameDa.trim(),
        description:   desc.trim(),
        descriptionDa: descDa.trim(),
        imageUrl:      imageUrl.trim(),
        spicyLevel,
      });
      // Send prices only for selected branches; price = 0 if field left blank
      await updatePrices.mutateAsync({
        id: item.id,
        prices: selectedBranchIds.map(id => ({
          branchId: id,
          price: prices[id] !== undefined && prices[id] !== "" ? Number(prices[id]) : 0,
        })),
      });
      toast.success("Item updated.");
      navigate({ to: "/admin/menu" });
    } catch { toast.error("Failed to update item."); }
  };

  const isSaving = updateItem.isPending || updatePrices.isPending;

  return (
    <FormPage title={`Edit — ${item.name}`} subtitle="Update item details, menus and prices" backTo="/admin/menu" maxWidth="max-w-2xl">
      <div className="space-y-5">
        {/* Name row */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input autoFocus value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Name <span className="text-xs text-muted-foreground">(Danish)</span></Label>
            <Input placeholder="Dansk navn" value={nameDa} onChange={e => setNameDa(e.target.value)} />
          </div>
        </div>

        {/* Description row */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description <span className="text-xs text-muted-foreground">(Danish)</span></Label>
            <Input placeholder="Kort beskrivelse" value={descDa} onChange={e => setDescDa(e.target.value)} />
          </div>
        </div>

        {/* Spicy + Image */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Spicy Level</Label>
            <Select value={String(spicyLevel)} onValueChange={v => setSpicyLevel(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SPICY_OPTIONS.map(o => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Image</Label>
            <ImagePicker value={imageUrl} onChange={setImageUrl} />
          </div>
        </div>

        {/* Menus */}
        {menus.length > 0 && (
          <div className="space-y-1.5 border-t pt-4">
            <Label>Menus (categories)</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {menus.map(m => {
                const active = menuIds.includes(m.id);
                return (
                  <button key={m.id} type="button" onClick={() => toggleMenu(m.id)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition
                      ${active ? "gradient-primary text-primary-foreground border-transparent" : "bg-muted text-muted-foreground hover:bg-accent"}`}>
                    {m.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Branch multi-select */}
        {branches.length > 0 && (
          <div className="border-t pt-4">
            <BranchMultiSelect
              branches={branches}
              selected={selectedBranchIds}
              onChange={handleBranchChange}
              label="Available at Branches"
            />
          </div>
        )}

        {/* Per-branch prices — only for selected branches */}
        {selectedBranchIds.length > 0 && (
          <div className="space-y-2 border-t pt-4">
            <Label>Prices (DKK)</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              {selectedBranchIds.map(id => {
                const b = branches.find(x => x.id === id);
                if (!b) return null;
                return (
                  <div key={id} className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground flex-1">{b.name.replace("Hind Indisk ", "")}</span>
                    <Input type="number" min={0} step={0.01} className="w-28" placeholder="0"
                      value={prices[id] ?? ""}
                      onChange={e => setPrices(p => ({ ...p, [id]: e.target.value }))} />
                    <span className="text-sm text-muted-foreground">DKK</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-4 border-t">
          <Button className="gradient-primary text-primary-foreground"
            disabled={!name.trim() || isSaving} onClick={handleSave}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-1.5 h-4 w-4" />}
            Save Changes
          </Button>
          <Button variant="outline" onClick={() => navigate({ to: "/admin/menu" })}>Cancel</Button>
        </div>
      </div>
    </FormPage>
  );
}
