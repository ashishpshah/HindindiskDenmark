import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type BranchDto = {
  id: number;
  name: string;
  nameDa?: string | null;
  address: string;
  addressDa?: string | null;
  addressLine2?: string;
  addressLine2Da?: string | null;
  city: string;
  cityDa?: string | null;
  postalCode: string;
  phone: string;
  email: string;
  googleMapsLink: string;
  weekdayHours: string;
  weekendHours: string;
  weekdayOpen: string;
  weekdayClose: string;
  weekendOpen: string;
  weekendClose: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  deliveryFee: number;
  deliveryFeeEnabled: boolean;
  isCloseOrder: boolean;
  closeOrderNote: string | null;
  closeOrderNoteDa: string | null;
  isCloseDelivery: boolean;
  closeDeliveryNote: string | null;
  isClosePickup: boolean;
  closePickupNote: string | null;
  maxAdvanceDays: number;
};

export function useBranches() {
  return useQuery({
    queryKey: ["branches"],
    queryFn:  () => apiFetch<BranchDto[]>("/api/locations"),
    staleTime: 1000 * 60 * 2, // 2 min — short enough for instant closure notes to propagate
  });
}
