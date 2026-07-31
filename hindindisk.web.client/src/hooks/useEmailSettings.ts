import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type EmailSettingsDto = {
  smtpHost:    string;
  smtpPort:    number;
  smtpUser:    string;
  fromName:    string;
  fromAddress: string;
  enabled:     boolean;
};

export type UpdateEmailSettingsInput = EmailSettingsDto & {
  smtpPass?: string;
};

export function useAdminEmailSettings() {
  return useQuery({
    queryKey: ["admin-email-settings"],
    queryFn:  () => apiFetch<EmailSettingsDto>("/api/admin/email-settings"),
  });
}

export function useUpdateEmailSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateEmailSettingsInput) =>
      apiFetch<EmailSettingsDto>("/api/admin/email-settings", {
        method: "PATCH",
        body:   JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-email-settings"] }),
  });
}
