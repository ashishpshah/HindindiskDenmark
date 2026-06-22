import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export function useDeleteOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/api/admin/offers/${id}`, { method: "DELETE" }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["admin-offers"] }),
  });
}
