import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type BranchDto = {
  id: number;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  email: string;
  googleMapsLink: string;
  weekdayHours: string;
  weekendHours: string;
};

export function useBranches() {
  return useQuery({
    queryKey: ["branches"],
    queryFn:  () => apiFetch<BranchDto[]>("/api/locations"),
    staleTime: 1000 * 60 * 60, // branches rarely change
  });
}
