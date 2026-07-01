import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { AdminMenuItemDto, AdminBranchPriceDto } from "./useAdminMenuItems";

export function useUpdateMenuItemPrices() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, prices }: { id: number; prices: Pick<AdminBranchPriceDto, "branchId" | "price">[] }) =>
      apiFetch<AdminMenuItemDto>(`/api/admin/menu-items/${id}/prices`, {
        method: "PATCH",
        body: JSON.stringify({ prices }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-menu-items"] });
    },
  });
}
