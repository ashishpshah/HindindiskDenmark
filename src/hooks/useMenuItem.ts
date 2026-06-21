import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { MenuItemDto } from "./useMenuItems";

export type MenuItemDetailDto = {
  item: MenuItemDto;
  relatedItems: MenuItemDto[];
};

export function useMenuItem(name: string, branchId?: number) {
  const qs = branchId ? `?branchId=${branchId}` : "";

  return useQuery({
    queryKey: ["menu-item", name, branchId],
    queryFn:  () =>
      apiFetch<MenuItemDetailDto>(`/api/menu/items/${encodeURIComponent(name)}${qs}`),
    enabled: !!name,
  });
}
