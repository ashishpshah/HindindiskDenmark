import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type OrderStatusDto = {
  id: number;
  name: string;
  nameDa: string | null;
  serviceType: string;
  displayOrder: number;
  color: string;
  isTerminal: boolean;
  isActive: boolean;
  createdAt: string;
};

export type CreateOrderStatusRequest = {
  name: string;
  nameDa?: string;
  serviceType: string;
  displayOrder: number;
  color?: string;
};

export type UpdateOrderStatusMetaRequest = {
  name: string;
  nameDa?: string;
  serviceType: string;
  displayOrder: number;
  color?: string;
  isActive: boolean;
};

export function useAdminOrderStatuses() {
  return useQuery({
    queryKey: ["admin-order-statuses"],
    queryFn: () => apiFetch<OrderStatusDto[]>("/api/admin/order-statuses"),
  });
}

export function useCreateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateOrderStatusRequest) =>
      apiFetch<OrderStatusDto>("/api/admin/order-statuses", {
        method: "POST",
        body: JSON.stringify(req),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-order-statuses"] }),
  });
}

export function useUpdateOrderStatusMeta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateOrderStatusMetaRequest }) =>
      apiFetch<OrderStatusDto>(`/api/admin/order-statuses/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-order-statuses"] }),
  });
}

export function useDeleteOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<void>(`/api/admin/order-statuses/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-order-statuses"] }),
  });
}
