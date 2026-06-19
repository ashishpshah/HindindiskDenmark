import { createFileRoute } from "@tanstack/react-router";
import { MapPin } from "lucide-react";

export const Route = createFileRoute("/account/addresses")({ component: AddressesPage });

function AddressesPage() {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-semibold">Saved Addresses</h2>
      <div className="rounded-3xl border bg-card p-6 shadow-soft">
        <div className="flex items-center gap-3"><MapPin className="h-5 w-5 text-primary" /><span className="font-semibold">Home</span></div>
        <div className="mt-2 text-sm text-muted-foreground">Frederiksgade 72, 8000 Aarhus C</div>
      </div>
    </div>
  );
}