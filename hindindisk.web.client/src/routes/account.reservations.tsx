import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMyReservations } from "@/hooks/useMyReservations";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/account/reservations")({ component: ReservationsPage });

function ReservationsPage() {
  const { t } = useI18n();
  const { data: list = [], isLoading, isError } = useMyReservations(true);

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
        <p className="text-muted-foreground">{t("reservations.errorLoad")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold">{t("reservations.title")}</h2>
        <Button asChild size="sm" className="gradient-primary text-primary-foreground">
          <Link to="/reservation">{t("reservations.newReservation")}</Link>
        </Button>
      </div>

      {list.length === 0 && (
        <div className="rounded-3xl border bg-card p-10 text-center shadow-soft">
          <CalendarCheck className="mx-auto h-10 w-10 text-muted-foreground" />
          <div className="mt-3 text-muted-foreground">{t("reservations.noReservations")}</div>
          <Button asChild className="mt-4 gradient-primary text-primary-foreground">
            <Link to="/reservation">{t("reservations.bookTable")}</Link>
          </Button>
        </div>
      )}

      {list.map((r) => (
        <div key={r.id} className="rounded-3xl border bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-semibold text-foreground">{r.branchName}</div>
              <div className="mt-0.5 text-sm text-muted-foreground">
                {r.date} · {r.timeSlot} · {r.guestCount} {r.guestCount === 1 ? t("reservations.guest") : t("reservations.guests")}
              </div>
              {r.specialRequests && (
                <div className="mt-1 text-xs text-muted-foreground italic">"{r.specialRequests}"</div>
              )}
            </div>
            <div className="ml-4 shrink-0">
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                r.status === "Confirmed"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-muted text-muted-foreground"
              }`}>
                {r.status === "Confirmed"
                  ? t("status.confirmed")
                  : r.status === "Pending"
                    ? t("status.pending")
                    : r.status}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
