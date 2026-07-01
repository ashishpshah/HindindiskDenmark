import { GitBranch } from "lucide-react";
import { Label } from "@/components/ui/label";

interface BranchOption {
  id: number;
  name: string;
}

interface Props {
  branches: BranchOption[];
  selected: number[];
  onChange: (ids: number[]) => void;
  label?: string;
}

export function BranchMultiSelect({ branches, selected, onChange, label = "Branches" }: Props) {
  const toggle = (id: number) =>
    onChange(selected.includes(id) ? selected.filter(b => b !== id) : [...selected, id]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
        <Label>{label}</Label>
      </div>
      <div className="flex flex-wrap gap-2">
        {branches.map(b => {
          const active = selected.includes(b.id);
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => toggle(b.id)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition
                ${active
                  ? "gradient-primary text-primary-foreground border-transparent"
                  : "bg-muted text-muted-foreground hover:bg-accent"}`}
            >
              {b.name.replace("Hind Indisk ", "")}
            </button>
          );
        })}
        {branches.length === 0 && (
          <p className="text-xs text-muted-foreground">No branches configured yet.</p>
        )}
      </div>
      {selected.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {selected.length} branch{selected.length !== 1 ? "es" : ""} selected
        </p>
      )}
    </div>
  );
}
