import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type AddressDto = {
  id: number;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  country: string;
  type: string;
};

export type SaveAddressInput = {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  country: string;
  type: string;
};

export function useAddresses(enabled = true) {
  return useQuery({
    queryKey: ["addresses"],
    queryFn:  () => apiFetch<AddressDto[]>("/api/addresses"),
    enabled,
  });
}

export function useAddAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SaveAddressInput) =>
      apiFetch<AddressDto>("/api/addresses", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });
}

export function useUpdateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: number } & SaveAddressInput) =>
      apiFetch<AddressDto>(`/api/addresses/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<void>(`/api/addresses/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });
}
