import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarCheck } from "lucide-react";

export const Route = createFileRoute("/account/reservations")({ component: ReservationsPage });

type Res = { id: string; branch: string; date: string; time: string; guests: number };

function ReservationsPage() {
  const [list, setList] = useState<Res[]>([]);
  useEffect(() => {
    try { setList(JSON.parse(localStorage.getItem("hind-reservations") || "[]")); } catch {}
  }, []);
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-semibold">My Reservations</h2>
      {list.length === 0 && (
        <div className="rounded-3xl border bg-card p-10 text-center shadow-soft">
          <CalendarCheck className="mx-auto h-10 w-10 text-muted-foreground" />
          <div className="mt-3 text-muted-foreground">No reservations yet.</div>
        </div>
      )}
      {list.map((r) => (
        <div key={r.id} className="rounded-3xl border bg-card p-5 shadow-soft">
          <div className="font-semibold">{r.branch}</div>
          <div className="text-sm text-muted-foreground">{r.date} · {r.time} · {r.guests} guests</div>
        </div>
      ))}
    </div>
  );
}