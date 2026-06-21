import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type PublicOfferDto = {
  id: number;
  title: string;
  description: string;
  discountType: string;
  discountValue: number;
  couponCode: string;
  endDate: string;
};

export function usePublicOffers() {
  return useQuery({
    queryKey: ["public-offers"],
    queryFn:  () => apiFetch<PublicOfferDto[]>("/api/offers"),
    staleTime: 1000 * 60 * 5,
  });
}
