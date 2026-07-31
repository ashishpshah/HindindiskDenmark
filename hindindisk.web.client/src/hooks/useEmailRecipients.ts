import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type BranchEmailRecipientsDto = {
  branchId:    number;
  branchName:  string;
  adminToMail: string;
  cc:          string;
  bcc:         string;
};

export type UpdateBranchEmailRecipientsInput = {
  branchId:    number;
  adminToMail: string;
  cc:          string;
  bcc:         string;
};

export function useAdminEmailRecipients() {
  return useQuery({
    queryKey: ["admin-email-recipients"],
    queryFn:  () => apiFetch<BranchEmailRecipientsDto[]>("/api/admin/email-settings/recipients"),
  });
}

export function useUpdateEmailRecipients() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ branchId, ...input }: UpdateBranchEmailRecipientsInput) =>
      apiFetch<BranchEmailRecipientsDto>(`/api/admin/email-settings/recipients/${branchId}`, {
        method: "PATCH",
        body:   JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-email-recipients"] }),
  });
}
