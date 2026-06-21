import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { AdminOfferDto } from "./useAdminOffers";

export function useToggleOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<AdminOfferDto>(`/api/admin/offers/${id}/toggle`, { method: "PATCH" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-offers"] });
    },
  });
}
