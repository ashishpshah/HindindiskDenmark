import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type TopItemDto = {
  name: string;
  quantity: number;
  revenue: number;
};

export function useTopItems(days = 7) {
  return useQuery({
    queryKey: ["admin-top-items", days],
    queryFn:  () => apiFetch<TopItemDto[]>(`/api/admin/dashboard/top-items?days=${days}`),
    refetchInterval: 60_000,
  });
}
