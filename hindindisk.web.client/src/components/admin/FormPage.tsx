import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export function FormPage({
  title,
  subtitle,
  backTo,
  children,
  maxWidth = "max-w-2xl",
}: {
  title: string;
  subtitle?: string;
  backTo: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to={backTo}
          className="rounded-xl border p-2 text-muted-foreground hover:bg-accent hover:text-primary transition"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>

      {/* Form card */}
      <div className={`${maxWidth} rounded-2xl border bg-card p-6 shadow-soft`}>
        {children}
      </div>
    </div>
  );
}
