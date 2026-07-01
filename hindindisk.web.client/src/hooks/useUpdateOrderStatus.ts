import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { AdminOrderDto } from "./useAdminOrders";

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, cancellationReason }: { id: number; status: string; cancellationReason?: string }) =>
      apiFetch<AdminOrderDto>(`/api/admin/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, cancellationReason }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
  });
}
