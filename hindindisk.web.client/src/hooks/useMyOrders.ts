import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";
import type { OrderDto } from "./useCreateOrder";

export function useMyOrders(enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-orders", user?.id],
    queryFn: () => apiFetch<OrderDto[]>("/api/orders/my"),
    enabled: enabled && !!user,
  });
}
