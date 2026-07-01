import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { AdminMenuDto } from "./useAdminMenus";

export type UpdateMenuInput = {
  id: number;
  name: string;
  nameDa?: string;
  description?: string;
  descriptionDa?: string;
  branchIds?: number[];
};

export function useUpdateMenu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateMenuInput) =>
      apiFetch<AdminMenuDto>(`/api/admin/menus/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-menus"] }),
  });
}
