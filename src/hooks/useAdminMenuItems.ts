import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type AdminBranchPriceDto = {
  branchId: number;
  branchName: string;
  price: number;
};

export type AdminMenuItemDto = {
  id: number;
  name: string;
  nameDa: string;
  description: string;
  descriptionDa: string;
  imageUrl: string;
  spicyLevel: number;
  labels: string[];
  isVegetarian: boolean;
  categories: string[];
  prices: AdminBranchPriceDto[];
};

export function useAdminMenuItems() {
  return useQuery({
    queryKey: ["admin-menu-items"],
    queryFn:  () => apiFetch<AdminMenuItemDto[]>("/api/admin/menu-items"),
  });
}
