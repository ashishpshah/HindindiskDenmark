import { MapPin, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { CustomerAddress } from "@/hooks/useCustomerLookup";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addresses: CustomerAddress[];
  onSelect: (address: CustomerAddress) => void;
  onNew: () => void;
};

export function AddressSelectDialog({ open, onOpenChange, addresses, onSelect, onNew }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Choose a delivery address</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground -mt-2">
          We found saved addresses for this account. Pick one or enter a new one.
        </p>

        <div className="space-y-2 mt-1">
          {addresses.map((addr) => (
            <button
              key={addr.id}
              type="button"
              onClick={() => { onSelect(addr); onOpenChange(false); }}
              className="w-full rounded-xl border bg-card p-4 text-left hover:border-primary hover:bg-primary/5 transition group"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-muted group-hover:bg-primary/10 transition">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {addr.type}
                  </div>
                  <div className="text-sm font-medium">
                    {addr.addressLine1}
                    {addr.addressLine2 && `, ${addr.addressLine2}`}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {addr.postalCode} {addr.city}, {addr.country}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <Button
          variant="outline"
          className="w-full mt-1"
          onClick={() => { onNew(); onOpenChange(false); }}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Enter a new address
        </Button>
      </DialogContent>
    </Dialog>
  );
}
