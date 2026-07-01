import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { AdminBranchDto } from "./useUpdateBranch";

export function useAdminBranches() {
  return useQuery({
    queryKey: ["admin-branches"],
    queryFn:  () => apiFetch<AdminBranchDto[]>("/api/admin/branches"),
  });
}
