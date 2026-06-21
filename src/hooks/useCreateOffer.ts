import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { AdminOfferDto } from "./useAdminOffers";

export type CreateOfferInput = {
  title: string;
  description: string;
  discountType: string;
  discountValue: number;
  couponCode?: string;
  minimumOrderAmount?: number;
  isFirstOrderOnly: boolean;
  usageLimit?: number;
  startDate: string;
  endDate: string;
};

export function useCreateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateOfferInput) =>
      apiFetch<AdminOfferDto>("/api/admin/offers", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-offers"] });
    },
  });
}
