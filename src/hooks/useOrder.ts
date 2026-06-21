import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { OrderDto } from "./useCreateOrder";

export function useOrder(id: string | undefined) {
  const numericId = id && /^\d+$/.test(id) ? parseInt(id, 10) : null;

  return useQuery({
    queryKey: ["order", id],
    queryFn: () => apiFetch<OrderDto>(`/api/orders/${numericId}`),
    enabled: numericId !== null && !isNaN(numericId),
  });
}
