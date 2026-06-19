import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/account/orders")({ component: OrdersPage });

type Order = { id: string; date: string; branch: string; type: string; total: number; lines: { name: string; qty: number }[]; status: string };

function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => {
    try { setOrders(JSON.parse(localStorage.getItem("hind-orders") || "[]")); } catch {}
  }, []);
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-semibold">My Orders</h2>
      {orders.length === 0 && (
        <div className="rounded-3xl border bg-card p-10 text-center shadow-soft">
          <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
          <div className="mt-3 text-muted-foreground">No orders yet.</div>
          <Button asChild className="mt-4 gradient-primary text-primary-foreground"><Link to="/menu">Browse menu</Link></Button>
        </div>
      )}
      {orders.map((o) => (
        <div key={o.id} className="rounded-3xl border bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-mono text-sm text-muted-foreground">{o.id}</div>
              <div className="font-semibold">{new Date(o.date).toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">{o.branch} · {o.type}</div>
            </div>
            <div className="text-right">
              <div className="font-display text-xl">{o.total} DKK</div>
              <div className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{o.status}</div>
            </div>
          </div>
          <div className="mt-3 text-sm text-muted-foreground">{o.lines.map((l) => `${l.qty}× ${l.name}`).join(" · ")}</div>
          <div className="mt-3">
            <Button asChild size="sm" variant="outline"><Link to="/order-tracking" search={{ id: o.id }}>Track</Link></Button>
          </div>
        </div>
      ))}
    </div>
  );
}