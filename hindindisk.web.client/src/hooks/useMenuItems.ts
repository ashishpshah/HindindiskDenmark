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
  labels: string[];
  isSignature: boolean;
  code: number;
};

export type MenuFilters = {
  category?: string;
  q?: string;
  branchId?: number;
  signature?: boolean;
};

export function useMenuItems(filters: MenuFilters = {}) {
  const params = new URLSearchParams();
  if (filters.category)  params.set("category",  filters.category);
  if (filters.q)         params.set("q",         filters.q);
  if (filters.branchId)  params.set("branchId",  String(filters.branchId));
  if (filters.signature) params.set("signature", "true");

  const qs = params.toString();

  return useQuery({
    queryKey: ["menu-items", filters.category, filters.q, filters.branchId, filters.signature],
    queryFn:  () => apiFetch<MenuItemDto[]>(`/api/menu/items${qs ? `?${qs}` : ""}`),
    staleTime: 1000 * 60 * 10,
  });
}
