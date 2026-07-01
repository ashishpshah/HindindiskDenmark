import { useState } from "react";
import { UtensilsCrossed } from "lucide-react";
import { BASE } from "@/lib/api/client";

function resolveUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${BASE}${url}`;
}

interface Props {
  src: string;
  alt: string;
  className?: string;
}

function Placeholder({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 ${className ?? ""}`}>
      <UtensilsCrossed className="h-10 w-10 text-orange-300" />
    </div>
  );
}

export function MenuItemPhoto({ src, alt, className }: Props) {
  const [failed, setFailed] = useState(false);
  const resolved = resolveUrl(src);

  if (!resolved || failed) return <Placeholder className={className} />;

  return (
    <img
      src={resolved}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
