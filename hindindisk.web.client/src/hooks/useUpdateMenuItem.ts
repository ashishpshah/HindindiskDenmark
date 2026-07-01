import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { AdminMenuItemDto } from "./useAdminMenuItems";

export type UpdateMenuItemInput = {
  id: number;
  name: string;
  nameDa?: string;
  description: string;
  descriptionDa?: string;
  imageUrl: string;
  code?: number;
  spicyLevel: number;
  isSignature: boolean;
};

export function useUpdateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateMenuItemInput) =>
      apiFetch<AdminMenuItemDto>(`/api/admin/menu-items/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-menu-items"] });
    },
  });
}
