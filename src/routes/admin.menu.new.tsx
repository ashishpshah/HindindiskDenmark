import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { useAdminMenus } from "@/hooks/useAdminMenus";
import { useBranches } from "@/hooks/useBranches";
import { useCreateMenuItem } from "@/hooks/useCreateMenuItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormPage } from "@/components/admin/FormPage";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { BranchMultiSelect } from "@/components/admin/BranchMultiSelect";

export const Route = createFileRoute("/admin/menu/new")({ component: MenuItemNewPage });

const SPICY_OPTIONS = [
  { value: 0, label: "None" }, { value: 1, label: "Mild" },
  { value: 2, label: "Medium" }, { value: 3, label: "Hot" },
];

type PriceMap = Record<number, string>;

function MenuItemNewPage() {
  const navigate              = useNavigate();
  const { data: menus    = [] } = useAdminMenus();
  const { data: branches = [] } = useBranches();
  const createItem            = useCreateMenuItem();

  const [name,          setName]          = useState("");
  const [nameDa,        setNameDa]        = useState("");
  const [desc,          setDesc]          = useState("");
  const [descDa,        setDescDa]        = useState("");
  const [imageUrl,      setImageUrl]      = useState("");
  const [spicyLevel,    setSpicyLevel]    = useState(0);
  const [menuIds,       setMenuIds]       = useState<number[]>([]);
  const [selectedBranchIds, setSelectedBranchIds] = useState<number[]>([]);
  const [prices,        setPrices]        = useState<PriceMap>({});

  const toggleMenu = (id: number) =>
    setMenuIds(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);

  const handleBranchChange = (ids: number[]) => {
    setSelectedBranchIds(ids);
    // Remove prices for deselected branches
    setPrices(prev => {
      const next: PriceMap = {};
      ids.forEach(id => { if (prev[id] !== undefined) next[id] = prev[id]; });
      return next;
    });
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      await createItem.mutateAsync({
        name:          name.trim(),
        nameDa:        nameDa.trim(),
        description:   desc.trim(),
        descriptionDa: descDa.trim(),
        imageUrl:      imageUrl.trim(),
        spicyLevel,
        menuIds,
        prices: selectedBranchIds
          .filter(id => prices[id] !== undefined && prices[id] !== "")
          .map(id => ({ branchId: id, price: Number(prices[id]) })),
      });
      toast.success("Item created.");
      navigate({ to: "/admin/menu" });
    } catch { toast.error("Failed to create item."); }
  };

  return (
    <FormPage title="Create Item" subtitle="Add a new menu item" backTo="/admin/menu" maxWidth="max-w-2xl">
      <div className="space-y-5">
        {/* Name row */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input autoFocus placeholder="e.g. Butter Chicken" value={name}
              onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Name <span className="text-xs text-muted-foreground">(Danish)</span></Label>
            <Input placeholder="e.g. Smørskylling" value={nameDa}
              onChange={e => setNameDa(e.target.value)} />
          </div>
        </div>

        {/* Description row */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input placeholder="Short description" value={desc}
              onChange={e => setDesc(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description <span className="text-xs text-muted-foreground">(Danish)</span></Label>
            <Input placeholder="Kort beskrivelse" value={descDa}
              onChange={e => setDescDa(e.target.value)} />
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
            disabled={!name.trim() || createItem.isPending} onClick={handleSave}>
            {createItem.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-1.5 h-4 w-4" />}
            Create Item
          </Button>
          <Button variant="outline" onClick={() => navigate({ to: "/admin/menu" })}>Cancel</Button>
        </div>
      </div>
    </FormPage>
  );
}
