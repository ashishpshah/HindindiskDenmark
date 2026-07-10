import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { OrderStatusDto } from "./useAdminOrderStatuses";

export function useOrderStatuses() {
  return useQuery({
    queryKey: ["order-statuses"],
    queryFn: () => apiFetch<OrderStatusDto[]>("/api/admin/order-statuses"),
    staleTime: 1000 * 60 * 5,
  });
}
