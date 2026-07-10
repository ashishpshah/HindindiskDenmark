import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type OrderStatusTransitionDto = {
  id: number;
  fromStatusId: number;
  toStatusId: number;
  serviceType: string;
  fromStatusName: string;
  toStatusName: string;
};

export type CreateOrderStatusTransitionRequest = {
  fromStatusId: number;
  toStatusId: number;
  serviceType: string;
};

export function useAdminOrderStatusTransitions() {
  return useQuery({
    queryKey: ["admin-order-status-transitions"],
    queryFn: () => apiFetch<OrderStatusTransitionDto[]>("/api/admin/order-status-transitions"),
  });
}

export function useCreateOrderStatusTransition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateOrderStatusTransitionRequest) =>
      apiFetch<OrderStatusTransitionDto>("/api/admin/order-status-transitions", {
        method: "POST",
        body: JSON.stringify(req),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-order-status-transitions"] }),
  });
}

export function useDeleteOrderStatusTransition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<void>(`/api/admin/order-status-transitions/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-order-status-transitions"] }),
  });
}
