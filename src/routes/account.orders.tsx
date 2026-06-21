import { createFileRoute, Link } from "@tanstack/react-router";
import { ShoppingBag, Loader2, MapPin, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMyOrders } from "@/hooks/useMyOrders";

export const Route = createFileRoute("/account/orders")({ component: OrdersPage });

const STATUS_COLORS: Record<string, string> = {
  Placed:         "bg-blue-100 text-blue-700",
  Accepted:       "bg-indigo-100 text-indigo-700",
  Preparing:      "bg-amber-100 text-amber-700",
  Ready:          "bg-cyan-100 text-cyan-700",
  OutForDelivery: "bg-purple-100 text-purple-700",
  Completed:      "bg-green-100 text-green-700",
  Cancelled:      "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  OutForDelivery: "Out For Delivery",
};

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
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-mono text-sm text-muted-foreground">#{o.id}</div>
              <div className="font-semibold">{new Date(o.createdAt).toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">{o.branchName} · {o.orderType}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-display text-xl">{o.total.toFixed(0)} DKK</div>
              <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[o.status] ?? "bg-primary/10 text-primary"}`}>
                {STATUS_LABELS[o.status] ?? o.status}
              </span>
            </div>
          </div>

          {/* Items */}
          <div className="mt-3 text-sm text-muted-foreground">
            {o.items.map((i) => `${i.quantity}× ${i.name}`).join(" · ")}
          </div>

          {/* Delivery address */}
          {o.deliveryAddress && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>{o.deliveryAddress}</span>
            </div>
          )}

          {/* Payment method */}
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Banknote className="h-3.5 w-3.5 shrink-0" />
            <span>{o.paymentMethod.replace(/([A-Z])/g, " $1").trim()}</span>
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
