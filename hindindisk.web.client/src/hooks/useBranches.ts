import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type BranchDto = {
  id: number;
  name: string;
  address: string;
  addressLine2?: string;
  city: string;
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
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  deliveryFee: number;
  deliveryFeeEnabled: boolean;
  isCloseOrder: boolean;
  isCloseReservation: boolean;
  maxAdvanceDays: number;
};

export function useBranches() {
  return useQuery({
    queryKey: ["branches"],
    queryFn:  () => apiFetch<BranchDto[]>("/api/locations"),
    staleTime: 1000 * 60 * 60, // branches rarely change
  });
}
