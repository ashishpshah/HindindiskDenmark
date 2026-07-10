import { useMutation } from "@tanstack/react-query";
import { apiUpload } from "@/lib/api/client";

export function useUploadImage(uploadUrl = "/api/admin/upload/image") {
  return useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      const res = await apiUpload<{ url: string }>(uploadUrl, fd);
      return res.url;
    },
  });
}
