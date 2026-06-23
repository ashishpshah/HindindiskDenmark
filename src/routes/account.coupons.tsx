import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Ticket } from "lucide-react";
import { toast } from "sonner";
import { usePublicOffers } from "@/hooks/usePublicOffers";

export const Route = createFileRoute("/account/coupons")({ component: CouponsPage });

function discountLabel(discountType: string, discountValue: number) {
  if (discountType === "Percent")      return `${discountValue}% off`;
  if (discountType === "FreeShipping") return "Free delivery";
  return `${discountValue} DKK off`;
}

function CouponsPage() {
  const { data: offers = [], isLoading } = usePublicOffers();

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-semibold">Available Coupons</h2>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-8">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading coupons…
        </div>
      ) : offers.length === 0 ? (
        <div className="rounded-3xl border bg-card p-8 text-center text-muted-foreground">
          No active coupons right now. Check back later!
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {offers.map((o) => (
            <div key={o.id} className="relative overflow-hidden rounded-3xl border bg-card p-6 shadow-soft">
              <div className="absolute inset-y-0 left-0 w-1 gradient-primary" />
              <div className="flex items-center gap-2 text-primary">
                <Ticket className="h-5 w-5" />
                <span className="font-display text-xl font-bold">{o.couponCode}</span>
              </div>
              <p className="mt-1 text-sm font-medium">{discountLabel(o.discountType, o.discountValue)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{o.description}</p>
              <div className="mt-2 text-xs text-muted-foreground">
                Expires {new Date(o.endDate).toLocaleDateString("en-DK", { day: "2-digit", month: "short", year: "numeric" })}
              </div>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(o.couponCode);
                    toast.success("Copied!");
                  } catch {
                    toast.error("Could not copy — please copy manually: " + o.couponCode);
                  }
                }}
                className="mt-4 text-sm font-semibold text-primary hover:underline"
              >
                Copy code
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
