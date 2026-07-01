import { createFileRoute, Link } from "@tanstack/react-router";
import { ShoppingBag, Loader2, MapPin, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMyOrders } from "@/hooks/useMyOrders";
import { useI18n } from "@/i18n/I18nProvider";

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

const STATUS_KEY_MAP: Record<string, string> = {
  Placed:         "status.placed",
  Accepted:       "status.accepted",
  Preparing:      "status.preparing",
  Ready:          "status.ready",
  OutForDelivery: "status.outForDelivery",
  Completed:      "status.completed",
  Cancelled:      "status.cancelled",
};

function OrdersPage() {
  const { t } = useI18n();
  const { data: orders = [], isLoading, isError } = useMyOrders(true);

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
        <p className="text-muted-foreground">{t("orders.errorLoad")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-semibold">{t("orders.title")}</h2>
      {orders.length === 0 && (
        <div className="rounded-3xl border bg-card p-10 text-center shadow-soft">
          <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
          <div className="mt-3 text-muted-foreground">{t("orders.noOrders")}</div>
          <Button asChild className="mt-4 gradient-primary text-primary-foreground">
            <Link to="/menu">{t("orders.browseMenu")}</Link>
          </Button>
        </div>
      )}
      {orders.map((o) => (
        <div key={o.id} className="rounded-3xl border bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-mono text-sm text-muted-foreground">#{o.id}</div>
              <div className="font-semibold">{new Date(o.createdAt).toLocaleString("da-DK", { timeZone: "Europe/Copenhagen" })}</div>
              <div className="text-sm text-muted-foreground">{o.branchName} · {o.orderType}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-display text-xl">{o.total.toFixed(0)} DKK</div>
              <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[o.status] ?? "bg-primary/10 text-primary"}`}>
                {STATUS_KEY_MAP[o.status] ? t(STATUS_KEY_MAP[o.status]) : o.status}
              </span>
            </div>
          </div>

          <div className="mt-3 text-sm text-muted-foreground">
            {o.items.map((i) => `${i.quantity}× ${i.name}`).join(" · ")}
          </div>

          {o.deliveryAddress && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>{o.deliveryAddress}</span>
            </div>
          )}

          <div className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${o.orderType === "Pickup" ? "text-amber-600" : "text-muted-foreground"}`}>
            <Banknote className="h-3.5 w-3.5 shrink-0" />
            <span>{o.orderType === "Pickup" ? t("checkout.payAtStore") : t("checkout.cashOnDelivery")}</span>
          </div>

          {o.status === "Cancelled" && o.cancellationReason && (
            <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
              <p className="text-xs font-semibold text-red-700">Cancellation reason</p>
              <p className="text-xs text-red-800 mt-0.5">{o.cancellationReason}</p>
            </div>
          )}

          <div className="mt-3">
            <Button asChild size="sm" variant="outline">
              <Link to="/order-tracking" search={{ id: String(o.id) }}>{t("orders.track")}</Link>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
