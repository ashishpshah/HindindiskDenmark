import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag, CalendarCheck, MapPin, ChevronRight, Clock, Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useCustomerActivities } from "@/context/CustomerHubContext";
import { useI18n } from "@/i18n/I18nProvider";
import { useMyOrders } from "@/hooks/useMyOrders";
import { useMyReservations } from "@/hooks/useMyReservations";
import { useAddresses } from "@/hooks/useAddresses";
import { nowInDenmark, todayInDenmark } from "@/lib/denmarkTime";
import { formatDate, formatDateStr, formatTimeStr } from "@/lib/dateFormat";
import type { ReservationDto } from "@/hooks/useCreateReservation";

export const Route = createFileRoute("/account/")({
  component: Dashboard,
});

// ── Status colours (kept in sync with account.orders.tsx) ─────────────────────
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtCountdown(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function fmtAgo(date: Date, nowMs: number): string {
  const diffSec = Math.floor((nowMs - date.getTime()) / 1000);
  if (diffSec < 5)  return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  return formatDate(date);
}

// ── Countdown hook ────────────────────────────────────────────────────────────

function useNearestCountdown(reservations: ReservationDto[]) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const now      = nowInDenmark();
  const todayIso = todayInDenmark();

  let nearest: { reservation: ReservationDto; secondsLeft: number } | null = null;

  for (const r of reservations) {
    if (r.date !== todayIso || r.status === "Cancelled") continue;
    const rsvTime = new Date(`${r.date}T${r.timeSlot}:00`);
    const diffSec = Math.floor((rsvTime.getTime() - now.getTime()) / 1000);
    if (diffSec > 0 && diffSec <= 30 * 60) {
      if (!nearest || diffSec < nearest.secondsLeft) {
        nearest = { reservation: r, secondsLeft: diffSec };
      }
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return nearest;
}

// ── "Now" ticker for ago labels ───────────────────────────────────────────────

function useNowMs() {
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);
  return nowMs;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

function Dashboard() {
  const { user } = useAuth();
  const { t }    = useI18n();
  const { activities, clearActivities } = useCustomerActivities();
  const nowMs = useNowMs();

  const { data: orders       = [] } = useMyOrders(!!user);
  const { data: reservations = [] } = useMyReservations(!!user);
  const { data: addresses    = [] } = useAddresses(!!user);

  const countdown = useNearestCountdown(reservations);

  if (!user) return null;

  const stats = [
    { to: "/account/orders",       label: t("account.myOrders"),       icon: ShoppingBag,  value: orders.length,       color: "bg-blue-50 text-blue-600" },
    { to: "/account/reservations", label: t("account.myReservations"), icon: CalendarCheck, value: reservations.length, color: "bg-green-50 text-green-600" },
    { to: "/account/addresses",    label: t("account.savedAddresses"), icon: MapPin,         value: addresses.length,    color: "bg-purple-50 text-purple-600" },
  ];

  const lastOrder = orders[0];
  const todayIso  = todayInDenmark();
  const nextResv  = reservations.find(r => r.date >= todayIso);

  return (
    <div className="space-y-6">

      {/* ── Stat cards ─────────────────────────────────────────────── */}
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

      {/* ── Nearest-reservation countdown (within 30 min) ──────────── */}
      <AnimatePresence>
        {countdown && (
          <motion.div
            key={countdown.reservation.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-4 rounded-2xl border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 p-4 shadow-soft"
          >
            <div className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-green-100 dark:bg-green-800/40 text-green-700 dark:text-green-300">
              <CalendarCheck className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-green-50 dark:ring-green-900/20 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-green-800 dark:text-green-200">
                Reservation coming up!
              </div>
              <div className="mt-0.5 text-xs text-green-700/80 dark:text-green-300/80 truncate">
                {countdown.reservation.branchName} · {formatDateStr(countdown.reservation.date)} {formatTimeStr(countdown.reservation.timeSlot)} · {countdown.reservation.guestCount} guest{countdown.reservation.guestCount !== 1 ? "s" : ""}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-mono text-xl font-bold text-green-700 dark:text-green-300 tabular-nums">
                {fmtCountdown(countdown.secondsLeft)}
              </div>
              <div className="text-xs text-green-600/70 dark:text-green-400/70">remaining</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Real-time activity feed ─────────────────────────────────── */}
      {activities.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              <Bell className="h-3.5 w-3.5" />
              Live Activity
            </h3>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground" onClick={clearActivities}>
              <X className="h-3 w-3 mr-1" /> Clear
            </Button>
          </div>

          <div className="overflow-hidden rounded-2xl border bg-card shadow-soft divide-y divide-border/60">
            <AnimatePresence initial={false}>
              {activities.map(a => (
                <motion.div
                  key={a.key}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link
                    to="/account/orders"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-accent/40 transition"
                  >
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-600">
                      <ShoppingBag className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">Order #{a.orderId}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[a.status] ?? "bg-primary/10 text-primary"}`}>
                          {STATUS_KEY_MAP[a.status] ? t(STATUS_KEY_MAP[a.status]) : a.status}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3 shrink-0" />
                        {fmtAgo(a.at, nowMs)}
                      </div>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ── Static recent activity ──────────────────────────────────── */}
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
                  {lastOrder.branchName} · {lastOrder.total.toFixed(0)} DKK · {formatDate(lastOrder.createdAt)}
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
                  {nextResv.branchName} · {formatDateStr(nextResv.date)} · {formatTimeStr(nextResv.timeSlot)} · {nextResv.guestCount} {t("reservations.guests")}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition shrink-0" />
            </Link>
          )}
        </div>
      )}

      {/* ── Quick links ─────────────────────────────────────────────── */}
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
