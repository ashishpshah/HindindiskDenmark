import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { AdminMenuDto } from "./useAdminMenus";

export type CreateMenuInput = {
  name: string;
  nameDa?: string;
  description?: string;
  descriptionDa?: string;
  branchIds?: number[];
};

export function useCreateMenu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateMenuInput) =>
      apiFetch<AdminMenuDto>("/api/admin/menus", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-menus"] }),
  });
}
