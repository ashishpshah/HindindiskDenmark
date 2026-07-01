import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { AdminMenuDto } from "./useAdminMenus";

export function useRemoveItemFromMenu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ menuId, itemId }: { menuId: number; itemId: number }) =>
      apiFetch<AdminMenuDto>(`/api/admin/menus/${menuId}/items/${itemId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-menus"] }),
  });
}
