import { useQueries } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { nowInDenmark, todayInDenmark } from "@/lib/denmarkTime";

type ClosureRule = {
  scope: string;
  closureType: "DateRange" | "Weekly";
  startDate: string | null;
  endDate: string | null;
  dayOfWeek: number | null;
  startTime: string | null;
  endTime: string | null;
  note: string | null;
};

function scopeCovers(scope: string, service: string) {
  return scope === "Restaurant" || scope === service;
}

function findActiveRule(rules: ClosureRule[], service: string): ClosureRule | null {
  const today = todayInDenmark();
  const now   = nowInDenmark().toTimeString().slice(0, 5);
  const dow   = new Date(today + "T00:00:00").getDay();

  return rules.find(r => {
    if (!scopeCovers(r.scope, service)) return false;
    const matchesDate =
      (r.closureType === "Weekly" && r.dayOfWeek === dow) ||
      (r.closureType === "DateRange" &&
        r.startDate != null && r.endDate != null &&
        today >= r.startDate && today <= r.endDate);
    if (!matchesDate) return false;
    if (r.startTime && r.endTime) return now >= r.startTime && now <= r.endTime;
    return true;
  }) ?? null;
}

export function usePublicClosures(branchIds: number[]) {
  const results = useQueries({
    queries: branchIds.map(id => ({
      // Shared cache key with useClosedDates — no duplicate fetches
      queryKey:        ["branch-closures", id] as const,
      queryFn:         () => apiFetch<ClosureRule[]>(`/api/locations/closures?branchId=${id}`),
      enabled:         id > 0,
      staleTime:       30_000,
      refetchInterval: 120_000,
    })),
  });

  const isClosedNow = (branchId: number, service: string): boolean => {
    const idx = branchIds.indexOf(branchId);
    if (idx < 0) return false;
    return findActiveRule(results[idx]?.data ?? [], service) !== null;
  };

  const closureNote = (branchId: number, service: string): string | null => {
    const idx = branchIds.indexOf(branchId);
    if (idx < 0) return null;
    return findActiveRule(results[idx]?.data ?? [], service)?.note ?? null;
  };

  return { isClosedNow, closureNote };
}
