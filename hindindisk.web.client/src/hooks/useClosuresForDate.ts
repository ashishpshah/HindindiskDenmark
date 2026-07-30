import { useQueries } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { checkClosed, type ClosureRule } from "@/lib/closureRules";

export function useClosuresForDate(branchIds: number[]) {
  const results = useQueries({
    queries: branchIds.map(id => ({
      // Shared cache key with useClosedDates/usePublicClosures — no duplicate fetches
      queryKey:        ["branch-closures", id] as const,
      queryFn:         () => apiFetch<ClosureRule[]>(`/api/locations/closures?branchId=${id}`),
      enabled:         id > 0,
      staleTime:       30_000,
      refetchInterval: 120_000,
    })),
  });

  const isClosedOnDate = (branchId: number, date: string, service: string): string | null => {
    const idx = branchIds.indexOf(branchId);
    if (idx < 0) return null;
    return checkClosed(results[idx]?.data ?? [], date, service);
  };

  return { isClosedOnDate };
}
