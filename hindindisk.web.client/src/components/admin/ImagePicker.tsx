import { useRef } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUploadImage } from "@/hooks/useUploadImage";
import { BASE } from "@/lib/api/client";

function resolveUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:")) return url;
  return `${BASE}${url}`;
}

interface Props {
  value: string;
  onChange: (url: string) => void;
}

export function ImagePicker({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const upload   = useUploadImage();

  const handleFile = async (file: File) => {
    try {
      const url = await upload.mutateAsync(file);
      onChange(url);
    } catch (err) {
      toast.error((err as Error).message ?? "Upload failed.");
    }
  };

  const resolved = resolveUrl(value);

  return (
    <div className="space-y-2">
      {/* Clickable image area */}
      <div
        role="button"
        tabIndex={upload.isPending ? -1 : 0}
        onClick={() => !upload.isPending && inputRef.current?.click()}
        onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !upload.isPending) inputRef.current?.click(); }}
        aria-label={resolved ? "Change image" : "Upload image"}
        className={`relative flex h-40 w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition
          ${upload.isPending ? "cursor-wait opacity-70" : "cursor-pointer hover:border-primary hover:bg-primary/5"}
          ${resolved ? "border-border bg-muted/10" : "border-muted-foreground/30 bg-muted/20"}`}
      >
        {resolved ? (
          <img src={resolved} alt="preview" className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground select-none">
            <ImagePlus className="h-8 w-8" />
            <span className="text-sm">Click to upload image</span>
            <span className="text-xs">JPG, PNG, WebP — max 10 MB</span>
          </div>
        )}

        {/* Upload spinner overlay */}
        {upload.isPending && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Clear button */}
        {resolved && !upload.isPending && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onChange(""); }}
            className="absolute right-2 top-2 rounded-full bg-background/80 p-1 text-muted-foreground shadow hover:text-destructive transition"
            title="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Change / upload button row */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={upload.isPending}
          onClick={() => inputRef.current?.click()}
          className="text-xs text-primary hover:underline disabled:opacity-50"
        >
          {resolved ? "Change image" : "Upload image"}
        </button>
        <span className="text-xs text-muted-foreground">·</span>
        {/* URL input fallback */}
        <input
          type="text"
          placeholder="or paste URL…"
          value={value.startsWith("/images/") ? "" : value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 rounded-lg border bg-background px-2.5 py-1 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.gif"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
