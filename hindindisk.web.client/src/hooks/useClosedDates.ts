import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { checkClosed, type ClosureRule } from "@/lib/closureRules";

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
