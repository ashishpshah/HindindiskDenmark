import { createFileRoute, Link } from "@tanstack/react-router";
import { ShoppingBag, CalendarCheck, MapPin, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n/I18nProvider";
import { useMyOrders } from "@/hooks/useMyOrders";
import { useMyReservations } from "@/hooks/useMyReservations";
import { useAddresses } from "@/hooks/useAddresses";
import { todayInDenmark } from "@/lib/denmarkTime";

export const Route = createFileRoute("/account/")({
  component: Dashboard,
});

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

function Dashboard() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { data: orders       = [] } = useMyOrders(!!user);
  const { data: reservations = [] } = useMyReservations(!!user);
  const { data: addresses    = [] } = useAddresses(!!user);

  if (!user) return null;

  const stats = [
    {
      to:    "/account/orders",
      label: t("account.myOrders"),
      icon:  ShoppingBag,
      value: orders.length,
      color: "bg-blue-50 text-blue-600",
    },
    {
      to:    "/account/reservations",
      label: t("account.myReservations"),
      icon:  CalendarCheck,
      value: reservations.length,
      color: "bg-green-50 text-green-600",
    },
    {
      to:    "/account/addresses",
      label: t("account.savedAddresses"),
      icon:  MapPin,
      value: addresses.length,
      color: "bg-purple-50 text-purple-600",
    },
  ];

  const lastOrder = orders[0];
  const todayIso  = todayInDenmark();
  const nextResv  = reservations.find((r) => r.date >= todayIso);

  return (
    <div className="space-y-6">

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.to}
              to={s.to as any}
              className="group flex items-center gap-4 rounded-2xl border bg-card p-5 shadow-soft transition hover:shadow-elegant hover:-translate-y-0.5"
            >
              <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${s.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-2xl font-display font-bold leading-none">{s.value}</div>
                <div className="mt-1 text-sm text-muted-foreground truncate">{s.label}</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition" />
            </Link>
          );
        })}
      </div>

      {/* Recent activity */}
      {(lastOrder || nextResv) && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-0.5">
            {t("account.recentActivity")}
          </h3>

          {lastOrder && (
            <Link
              to="/account/orders"
              className="group flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-soft transition hover:shadow-elegant"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Order #{lastOrder.id}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[lastOrder.status] ?? "bg-primary/10 text-primary"}`}>
                    {STATUS_KEY_MAP[lastOrder.status] ? t(STATUS_KEY_MAP[lastOrder.status]) : lastOrder.status}
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground truncate">
                  {lastOrder.branchName} · {lastOrder.total.toFixed(0)} DKK ·{" "}
                  {new Date(lastOrder.createdAt).toLocaleDateString("da-DK", { timeZone: "Europe/Copenhagen" })}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition shrink-0" />
            </Link>
          )}

          {nextResv && (
            <Link
              to="/account/reservations"
              className="group flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-soft transition hover:shadow-elegant"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-green-50 text-green-600">
                <CalendarCheck className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{t("account.upcomingReservation")}</div>
                <div className="mt-0.5 text-xs text-muted-foreground truncate">
                  {nextResv.branchName} · {nextResv.date} · {nextResv.timeSlot} · {nextResv.guestCount} {t("reservations.guests")}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition shrink-0" />
            </Link>
          )}
        </div>
      )}

      {/* Quick links */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-0.5">
          {t("account.quickActions")}
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            to="/menu"
            className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-soft transition hover:shadow-elegant group"
          >
            <div className="grid h-9 w-9 place-items-center rounded-xl gradient-primary text-primary-foreground shrink-0">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{t("account.browseMenu")}</div>
              <div className="text-xs text-muted-foreground">{t("account.placeNewOrder")}</div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition shrink-0" />
          </Link>
          <Link
            to="/reservation"
            className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-soft transition hover:shadow-elegant group"
          >
            <div className="grid h-9 w-9 place-items-center rounded-xl gradient-primary text-primary-foreground shrink-0">
              <CalendarCheck className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{t("actions.bookTable")}</div>
              <div className="text-xs text-muted-foreground">{t("account.reserveSeat")}</div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition shrink-0" />
          </Link>
        </div>
      </div>

    </div>
  );
}
