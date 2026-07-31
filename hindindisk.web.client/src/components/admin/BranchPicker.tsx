import { Store } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AdminBranchDto } from "@/hooks/useUpdateBranch";

const BRANCH_ALL = "__all__";

export function BranchPicker({ branches, value, onChange, allLabel, hideLabel }: {
  branches: AdminBranchDto[];
  value: number | undefined;
  onChange: (id: number | undefined) => void;
  allLabel?: string;
  hideLabel?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      {!hideLabel && <Label className="text-xs font-medium text-muted-foreground">Branch</Label>}
      <Select
        value={value !== undefined ? String(value) : BRANCH_ALL}
        onValueChange={v => onChange(v !== BRANCH_ALL ? Number(v) : undefined)}
      >
        <SelectTrigger data-tagid="select-settings-branch" className="w-full sm:w-72">
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Select a branch" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {allLabel && <SelectItem value={BRANCH_ALL}>{allLabel}</SelectItem>}
          {branches.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
