import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { AdminBranchDto, UpdateBranchInput } from "./useUpdateBranch";

export type CreateBranchInput = Omit<UpdateBranchInput, never>;

export function useCreateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateBranchInput) =>
      apiFetch<AdminBranchDto>("/api/admin/branches", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["branches"] });
    },
  });
}
