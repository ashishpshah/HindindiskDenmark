import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type MenuItemDto = {
  id: number;
  name: string;
  nameDa: string;
  description: string;
  descriptionDa: string;
  imageUrl: string;
  spicyLevel: number;
  price: number;
  category: string;
  categoryDa: string;
  categoryId: number;
  isVegetarian: boolean;
  labels: string[];
};

export type MenuFilters = {
  category?: string;
  q?: string;
  veg?: boolean;
  branchId?: number;
};

export function useMenuItems(filters: MenuFilters = {}) {
  const params = new URLSearchParams();
  if (filters.category) params.set("category", filters.category);
  if (filters.q)        params.set("q", filters.q);
  if (filters.veg)      params.set("veg", "true");
  if (filters.branchId) params.set("branchId", String(filters.branchId));

  const qs = params.toString();

  return useQuery({
    queryKey: ["menu-items", filters],
    queryFn:  () => apiFetch<MenuItemDto[]>(`/api/menu/items${qs ? `?${qs}` : ""}`),
    staleTime: 1000 * 60 * 10,
  });
}
