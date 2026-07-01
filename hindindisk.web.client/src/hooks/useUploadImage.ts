import { useMutation } from "@tanstack/react-query";
import { apiUpload } from "@/lib/api/client";

export function useUploadImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      const res = await apiUpload<{ url: string }>("/api/admin/upload/image", fd);
      return res.url;
    },
  });
}
