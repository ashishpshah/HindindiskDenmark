import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type UpdateBranchInput = {
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  googleMapsLink: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  deliveryFee: number;
  deliveryFeeEnabled: boolean;
  maxAdvanceDays: number;
};

export type AdminBranchDto = {
  id: number;
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  googleMapsLink: string;
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

export function useUpdateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateBranchInput & { id: number }) =>
      apiFetch<AdminBranchDto>(`/api/admin/branches/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["branches"] });
      qc.invalidateQueries({ queryKey: ["admin-branches"] });
    },
  });
}
