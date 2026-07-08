import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

type ClosureRule = {
  scope: string;
  closureType: "DateRange" | "Weekly";
  startDate: string | null;
  endDate: string | null;
  dayOfWeek: number | null;  // 0=Sun..6=Sat, mirrors JS Date.getDay()
  startTime: string | null;
  note: string | null;
};

function scopeCovers(scope: string, service: string): boolean {
  return scope === "Restaurant" || scope === service;
}

function checkClosed(rules: ClosureRule[], date: string, service: string): string | null {
  const d = new Date(date + "T00:00:00");
  const dow = d.getDay();

  for (const rule of rules) {
    if (!scopeCovers(rule.scope, service)) continue;
    if (rule.startTime !== null) continue; // partial-day only — doesn't block the whole date

    if (rule.closureType === "Weekly" && rule.dayOfWeek === dow) {
      return rule.note ?? "Closed";
    }
    if (
      rule.closureType === "DateRange" &&
      rule.startDate &&
      rule.endDate &&
      date >= rule.startDate &&
      date <= rule.endDate
    ) {
      return rule.note ?? "Closed";
    }
  }
  return null;
}

export function useClosedDates(branchId: number | undefined) {
  const { data = [] } = useQuery<ClosureRule[]>({
    queryKey: ["branch-closures", branchId],
    queryFn:  () => apiFetch(`/api/locations/closures?branchId=${branchId}`),
    enabled:  !!branchId,
    staleTime: 30_000,
    refetchInterval: 120_000, // fallback poll if SignalR connection drops
  });

  return (date: string, service: string): string | null =>
    checkClosed(data, date, service);
}
