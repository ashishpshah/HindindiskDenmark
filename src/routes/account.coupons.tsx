import { createFileRoute } from "@tanstack/react-router";
import { Ticket } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/account/coupons")({ component: CouponsPage });

const COUPONS = [
  { code: "WELCOME10", desc: "10% off your first order" },
  { code: "FAMILY20", desc: "20% off family dinner (4+ guests)" },
  { code: "FREEDELIVERY", desc: "Free delivery on any order" },
];

function CouponsPage() {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-semibold">My Coupons</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {COUPONS.map((c) => (
          <div key={c.code} className="relative overflow-hidden rounded-3xl border bg-card p-6 shadow-soft">
            <div className="absolute inset-y-0 left-0 w-1 gradient-primary" />
            <div className="flex items-center gap-2 text-primary"><Ticket className="h-5 w-5" /><span className="font-display text-xl font-bold">{c.code}</span></div>
            <p className="mt-2 text-sm text-muted-foreground">{c.desc}</p>
            <button onClick={() => { navigator.clipboard.writeText(c.code); toast.success("Copied!"); }} className="mt-4 text-sm font-semibold text-primary hover:underline">Copy code</button>
          </div>
        ))}
      </div>
    </div>
  );
}