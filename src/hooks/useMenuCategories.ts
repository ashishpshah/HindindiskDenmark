import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type MenuCategoryDto = {
  id: number;
  name: string;
  description: string;
  itemCount: number;
};

export function useMenuCategories() {
  return useQuery({
    queryKey: ["menu-categories"],
    queryFn: () => apiFetch<MenuCategoryDto[]>("/api/menu/categories"),
    staleTime: 1000 * 60 * 10, // 10 min
  });
}
