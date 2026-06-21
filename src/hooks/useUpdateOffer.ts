import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { AdminOfferDto } from "./useAdminOffers";
import type { CreateOfferInput } from "./useCreateOffer";

export function useUpdateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: number } & CreateOfferInput) =>
      apiFetch<AdminOfferDto>(`/api/admin/offers/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-offers"] });
    },
  });
}
