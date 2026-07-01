import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { OrderDto } from "./useCreateOrder";

export function useMyOrders(enabled = true) {
  return useQuery({
    queryKey: ["my-orders"],
    queryFn: () => apiFetch<OrderDto[]>("/api/orders/my"),
    enabled,
  });
}
