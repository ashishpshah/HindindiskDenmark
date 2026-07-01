import { Label } from "@/components/ui/label";
import type { ReactNode } from "react";

export function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}
