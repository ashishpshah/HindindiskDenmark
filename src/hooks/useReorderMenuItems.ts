import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { AdminMenuDto } from "@/hooks/useAdminMenus";

type ReorderEntry = { itemId: number; sortOrder: number };

export function useReorderMenuItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ menuId, items }: { menuId: number; items: ReorderEntry[] }) =>
      apiFetch<AdminMenuDto>(`/api/admin/menus/${menuId}/items/reorder`, {
        method: "PATCH",
        body: JSON.stringify({ items }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-menus"] }),
  });
}
