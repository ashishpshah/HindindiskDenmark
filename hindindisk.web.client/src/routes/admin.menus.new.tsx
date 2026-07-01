import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { useCreateMenu } from "@/hooks/useCreateMenu";
import { useBranches } from "@/hooks/useBranches";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormPage } from "@/components/admin/FormPage";
import { BranchMultiSelect } from "@/components/admin/BranchMultiSelect";

export const Route = createFileRoute("/admin/menus/new")({ component: MenuNewPage });

function MenuNewPage() {
  const navigate             = useNavigate();
  const create               = useCreateMenu();
  const { data: branches = [] } = useBranches();

  const [name,       setName]       = useState("");
  const [nameDa,     setNameDa]     = useState("");
  const [desc,       setDesc]       = useState("");
  const [descDa,     setDescDa]     = useState("");
  const [branchIds,  setBranchIds]  = useState<number[]>([]);

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      const menu = await create.mutateAsync({
        name:          name.trim(),
        nameDa:        nameDa.trim(),
        description:   desc.trim(),
        descriptionDa: descDa.trim(),
        branchIds,
      });
      toast.success("Menu created. You can now add items.");
      navigate({ to: "/admin/menus/$menuId", params: { menuId: String(menu.id) } });
    } catch (e) { toast.error((e as Error).message || "Failed to create menu."); }
  };

  return (
    <FormPage title="Create Menu" subtitle="Add a new menu category" backTo="/admin/menus">
      <div className="space-y-5">
        {/* Name row */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input autoFocus placeholder="e.g. Starters" value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSave()} />
          </div>
          <div className="space-y-1.5">
            <Label>Name <span className="text-xs text-muted-foreground">(Danish)</span></Label>
            <Input placeholder="e.g. Forretter" value={nameDa}
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

        {/* Branch selection */}
        <div className="border-t pt-4">
          <BranchMultiSelect
            branches={branches}
            selected={branchIds}
            onChange={setBranchIds}
            label="Available at Branches"
          />
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button className="gradient-primary text-primary-foreground"
            disabled={!name.trim() || create.isPending} onClick={handleSave}>
            {create.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-1.5 h-4 w-4" />}
            Create Menu
          </Button>
          <Button variant="outline" onClick={() => navigate({ to: "/admin/menus" })}>Cancel</Button>
        </div>
      </div>
    </FormPage>
  );
}
