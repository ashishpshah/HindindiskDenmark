import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

type UpdateProfileInput = {
  firstname: string;
  lastname: string;
  phone?: string;
};

type UserDto = {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  role: string;
};

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateProfileInput) =>
      apiFetch<UserDto>("/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}
