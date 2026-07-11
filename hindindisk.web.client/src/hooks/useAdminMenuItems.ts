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
  categories: string[];
  prices: AdminBranchPriceDto[];
  isSignature: boolean;
  code: number;
};

export type MenuItemPageDto = {
  items: AdminMenuItemDto[];
  total: number;
};

export type MenuItemFilters = {
  page: number;
  pageSize: number;
  search?: string;
  branchId?: number;
};

export function useAdminMenuItems(filters?: MenuItemFilters) {
  const qs = new URLSearchParams();
  if (filters) {
    qs.set("page",     String(filters.page));
    qs.set("pageSize", String(filters.pageSize));
    if (filters.search)   qs.set("search",   filters.search);
    if (filters.branchId) qs.set("branchId", String(filters.branchId));
  }

  return useQuery({
    queryKey: filters ? ["admin-menu-items", filters] : ["admin-menu-items"],
    queryFn:  () => apiFetch<MenuItemPageDto>(
      `/api/admin/menu-items${filters ? `?${qs}` : ""}`
    ),
  });
}
