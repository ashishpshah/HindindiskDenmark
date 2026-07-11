import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type StatusCountDto = {
  statusName: string;
  count: number;
};

export function useOrderCountsByStatus() {
  return useQuery({
    queryKey: ["admin-order-counts-by-status"],
    queryFn:  () => apiFetch<StatusCountDto[]>("/api/admin/orders/counts-by-status"),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}
