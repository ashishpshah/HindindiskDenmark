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

export function useAdminMenus() {
  return useQuery({
    queryKey: ["admin-menus"],
    queryFn:  () => apiFetch<AdminMenuDto[]>("/api/admin/menus"),
  });
}
