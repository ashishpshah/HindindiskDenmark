import { createFileRoute, Link } from "@tanstack/react-router";
import { ShoppingBag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMyOrders } from "@/hooks/useMyOrders";

export const Route = createFileRoute("/account/orders")({ component: OrdersPage });

function OrdersPage() {
  const { data: orders = [], isLoading, isError } = useMyOrders();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-3xl border bg-card p-10 text-center shadow-soft">
        <p className="text-muted-foreground">Could not load orders. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-semibold">My Orders</h2>
      {orders.length === 0 && (
        <div className="rounded-3xl border bg-card p-10 text-center shadow-soft">
          <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
          <div className="mt-3 text-muted-foreground">No orders yet.</div>
          <Button asChild className="mt-4 gradient-primary text-primary-foreground">
            <Link to="/menu">Browse menu</Link>
          </Button>
        </div>
      )}
      {orders.map((o) => (
        <div key={o.id} className="rounded-3xl border bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-mono text-sm text-muted-foreground">#{o.id}</div>
              <div className="font-semibold">{new Date(o.createdAt).toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">{o.branchName} · {o.orderType}</div>
            </div>
            <div className="text-right">
              <div className="font-display text-xl">{o.total.toFixed(0)} DKK</div>
              <div className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {o.status}
              </div>
            </div>
          </div>
          <div className="mt-3 text-sm text-muted-foreground">
            {o.items.map((i) => `${i.quantity}× ${i.name}`).join(" · ")}
          </div>
          <div className="mt-3">
            <Button asChild size="sm" variant="outline">
              <Link to="/order-tracking" search={{ id: String(o.id) }}>Track</Link>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
