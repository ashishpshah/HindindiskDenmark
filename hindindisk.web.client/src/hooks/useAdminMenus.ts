import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type AdminMenuItemSummary = {
  id: number;
  name: string;
  nameDa: string;
  imageUrl: string;
  price?: number;
  sortOrder: number;
};

export type AdminMenuDto = {
  id: number;
  name: string;
  nameDa: string;
  description: string;
  descriptionDa: string;
  isActive: boolean;
  itemCount: number;
  items: AdminMenuItemSummary[];
  branchIds: number[];
};

export type MenuPageDto = {
  items: AdminMenuDto[];
  total: number;
};

export type MenuFilters = {
  page: number;
  pageSize: number;
  search?: string;
  branchId?: number;
};

export function useAdminMenus(filters?: MenuFilters) {
  const qs = new URLSearchParams();
  if (filters) {
    qs.set("page",     String(filters.page));
    qs.set("pageSize", String(filters.pageSize));
    if (filters.search)   qs.set("search",   filters.search);
    if (filters.branchId) qs.set("branchId", String(filters.branchId));
  }

  return useQuery({
    queryKey: filters ? ["admin-menus", filters] : ["admin-menus"],
    queryFn:  () => apiFetch<MenuPageDto>(
      `/api/admin/menus${filters ? `?${qs}` : ""}`
    ),
  });
}
