import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { AdminMenuItemDto } from "./useAdminMenuItems";

export type CreateMenuItemInput = {
  name: string;
  nameDa?: string;
  description: string;
  descriptionDa?: string;
  imageUrl: string;
  code?: number;
  spicyLevel: number;
  menuIds: number[];
  prices: { branchId: number; price: number }[];
};

export function useCreateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateMenuItemInput) =>
      apiFetch<AdminMenuItemDto>("/api/admin/menu-items", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-menu-items"] });
      qc.invalidateQueries({ queryKey: ["admin-menus"] });
    },
  });
}
