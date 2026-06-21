import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, ChefHat, Package, Bike, ClipboardCheck, ClipboardList } from "lucide-react";
import { Layout } from "@/components/Layout";
import { PageHero } from "@/components/PageHero";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { useOrder } from "@/hooks/useOrder";

const search = z.object({ id: z.string().optional() });

export const Route = createFileRoute("/order-tracking")({
  validateSearch: (s) => search.parse(s),
  head: () => ({ meta: [{ title: "Track Order — Hind Indisk Restaurant" }] }),
  component: TrackPage,
});

const STAGES = [
  { label: "Order Placed",      icon: ClipboardList  },
  { label: "Accepted",          icon: ClipboardCheck },
  { label: "Preparing",         icon: ChefHat        },
  { label: "Ready",             icon: Package        },
  { label: "Out For Delivery",  icon: Bike           },
  { label: "Completed",         icon: Check          },
];

const STATUS_TO_STAGE: Record<string, number> = {
  Placed: 0, Accepted: 1, Preparing: 2, Ready: 3,
  OutForDelivery: 4, "Out For Delivery": 4,
  Completed: 5,
};

// Legacy localStorage order shape (HIN-XXXXXX format from pre-API era)
type LegacyOrder = { id: string; date: string; branch: string; type: string; total: number; lines: { name: string; qty: number; price: number }[]; status: string };

function loadLegacyOrder(id: string): LegacyOrder | null {
  try {
    const orders = JSON.parse(localStorage.getItem("hind-orders") || "[]") as LegacyOrder[];
    return orders.find((o) => o.id === id) ?? null;
  } catch {
    return null;
  }
}

function TrackPage() {
  const { id }            = Route.useSearch();
  const navigate          = useNavigate();
  const [stage, setStage] = useState(0);
  const [code, setCode]   = useState(id || "");

  const isNumericId = id !== undefined && /^\d+$/.test(id);

  const { data: apiOrder, isLoading } = useOrder(id);
  const legacyOrder = !isNumericId && id ? loadLegacyOrder(id) : null;

  const resolvedStatus = apiOrder?.status ?? legacyOrder?.status ?? "Placed";

  useEffect(() => {
    if (!id) return;
    const initialStage = STATUS_TO_STAGE[resolvedStatus] ?? 0;
    setStage(initialStage);

    // Only run the demo animation for legacy (non-numeric) orders
    if (isNumericId) return;
    const remaining = [1, 2, 3, 4, 5].filter((i) => i > initialStage);
    const timers    = remaining.map((i, idx) => setTimeout(() => setStage(i), (idx + 1) * 1500));
    return () => timers.forEach(clearTimeout);
  }, [id, resolvedStatus, isNumericId]);

  return (
    <Layout>
      <PageHero eyebrow="Track" title="Order Tracking" subtitle="Follow your order in real time."
        image="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1920&q=80" />

      <section className="mx-auto max-w-5xl px-6 py-12">
        {!id ? (
          <form
            className="mx-auto max-w-md flex gap-2"
            onSubmit={(e) => { e.preventDefault(); if (code) navigate({ to: "/order-tracking", search: { id: code } }); }}
          >
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter order ID, e.g. 12" />
            <Button className="gradient-primary text-primary-foreground">Track</Button>
          </form>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr,380px]">
            <div className="rounded-3xl border bg-card p-6 sm:p-8 shadow-soft h-fit">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Order ID</div>
                  <div className="font-mono text-lg font-semibold">{isNumericId ? `#${id}` : id}</div>
                </div>
                <div className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                  {STAGES[stage].label}
                </div>
              </div>

              {isLoading && isNumericId && (
                <div className="text-center py-2 text-sm text-muted-foreground">Loading order…</div>
              )}

              <div className="space-y-4">
                {STAGES.map((s, i) => {
                  const Icon   = s.icon;
                  const done   = i <= stage;
                  const active = i === stage;
                  return (
                    <div key={s.label} className="flex items-start gap-4">
                      <motion.div
                        animate={active ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                        transition={{ repeat: active ? Infinity : 0, duration: 1.5 }}
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${done ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                      >
                        <Icon className="h-5 w-5" />
                      </motion.div>
                      <div className="flex-1 pt-2">
                        <div className={`font-semibold ${done ? "" : "text-muted-foreground"}`}>{s.label}</div>
                        {i < STAGES.length - 1 && <div className={`my-2 ml-1 h-6 w-px ${i < stage ? "bg-primary" : "bg-border"}`} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* API order panel */}
            {apiOrder && (
              <aside className="rounded-3xl border bg-card p-6 shadow-soft h-fit space-y-6">
                <div>
                  <h3 className="font-display text-xl font-semibold">Order Details</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Placed on {new Date(apiOrder.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="space-y-3 border-t pt-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-semibold text-right max-w-[200px]">{apiOrder.branchName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order Type</span>
                    <span className="font-semibold">{apiOrder.orderType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-semibold text-primary">{STAGES[stage].label}</span>
                  </div>
                </div>
                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-semibold text-sm">Items Ordered</h4>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {apiOrder.items.map((item) => (
                      <div key={item.menuItemId} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.quantity} × {item.name}</span>
                        <span className="font-medium">{(item.priceAtPurchase * item.quantity).toFixed(0)} DKK</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t pt-4 flex justify-between font-display text-lg font-bold">
                  <span>Total Paid</span>
                  <span className="text-primary">{apiOrder.total.toFixed(0)} DKK</span>
                </div>
              </aside>
            )}

            {/* Legacy localStorage order panel */}
            {legacyOrder && !apiOrder && (
              <aside className="rounded-3xl border bg-card p-6 shadow-soft h-fit space-y-6">
                <div>
                  <h3 className="font-display text-xl font-semibold">Order Details</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Placed on {new Date(legacyOrder.date).toLocaleString()}
                  </p>
                </div>
                <div className="space-y-3 border-t pt-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-semibold">{legacyOrder.branch}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order Type</span>
                    <span className="font-semibold capitalize">{legacyOrder.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-semibold text-primary">{STAGES[stage].label}</span>
                  </div>
                </div>
                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-semibold text-sm">Items Ordered</h4>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {legacyOrder.lines?.map((l) => (
                      <div key={l.name} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{l.qty} × {l.name}</span>
                        <span className="font-medium">{l.price * l.qty} DKK</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t pt-4 flex justify-between font-display text-lg font-bold">
                  <span>Total Paid</span>
                  <span className="text-primary">{legacyOrder.total} DKK</span>
                </div>
              </aside>
            )}
          </div>
        )}
      </section>
    </Layout>
  );
}
