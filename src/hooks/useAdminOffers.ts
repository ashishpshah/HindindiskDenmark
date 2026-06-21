import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type AdminOfferDto = {
  id: number;
  title: string;
  description: string;
  offerType: string;
  discountType: string;
  discountValue: number;
  couponCode?: string;
  minimumOrderAmount?: number;
  isAutoApply: boolean;
  usageLimit?: number;
  usageCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
};

export function useAdminOffers() {
  return useQuery({
    queryKey: ["admin-offers"],
    queryFn:  () => apiFetch<AdminOfferDto[]>("/api/admin/offers"),
  });
}
