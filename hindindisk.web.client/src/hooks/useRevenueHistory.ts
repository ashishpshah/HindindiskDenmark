import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type RevenuePointDto = {
  date: string;
  revenue: number;
};

export function useRevenueHistory(days = 7) {
  return useQuery({
    queryKey: ["admin-revenue-history", days],
    queryFn:  () => apiFetch<RevenuePointDto[]>(`/api/admin/dashboard/revenue-history?days=${days}`),
    refetchInterval: 60_000,
  });
}
