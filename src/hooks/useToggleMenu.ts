import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { AdminMenuDto } from "./useAdminMenus";

export function useToggleMenu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<AdminMenuDto>(`/api/admin/menus/${id}/toggle`, { method: "PATCH" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-menus"] });
    },
  });
}
