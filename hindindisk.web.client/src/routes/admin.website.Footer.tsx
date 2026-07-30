import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  useAdminFooterSettings, useUpdateFooterSettings,
  type FooterSettingsDto,
} from "@/hooks/useFooterSettings";

export const Route = createFileRoute("/admin/website/Footer")({ component: FooterSettingsPage });

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function FooterSettingsPage() {
  const { data: settings, isLoading } = useAdminFooterSettings();
  const update = useUpdateFooterSettings();

  type Field_ = keyof FooterSettingsDto;
  const [draft, setDraft] = useState<Partial<FooterSettingsDto>>({});

  const val = (key: Field_) => (draft[key] !== undefined ? draft[key] : settings?.[key]) ?? "";
  const set = (key: Field_) => (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    setDraft(p => ({ ...p, [key]: e.target.value }));

  const handleSave = async () => {
    if (!settings) return;
    try {
      const payload: Partial<FooterSettingsDto> = {
        copyright:   val("copyright"),
        copyrightDa: val("copyrightDa"),
      };
      await update.mutateAsync(payload);
      toast.success("Footer settings saved");
      setDraft({});
    } catch { toast.error("Failed to save"); }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-8">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Footer</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage footer content</p>
      </div>

      <div className="space-y-4 max-w-3xl">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Copyright</h3>
        <p className="text-xs text-muted-foreground -mt-2">
          Shown at the bottom of the site as "© {new Date().getFullYear()} {"{this text}"}". The year is always current — no need to include it here.
          HTML is supported (e.g. a link): <code className="rounded bg-muted px-1 py-0.5">Powered By &lt;a href="https://example.com" target="_blank" rel="noopener noreferrer"&gt;Example&lt;/a&gt;</code>
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Copyright Text (EN)">
            <Textarea
              rows={5}
              value={val("copyright")}
              onChange={set("copyright")}
              placeholder='Powered By <a href="https://example.com" target="_blank" rel="noopener noreferrer">Example</a>'
              data-tagid="input-website-footer-copyright"
            />
          </Field>
          <Field label="Copyright Text (DA)">
            <Textarea
              rows={5}
              value={val("copyrightDa")}
              onChange={set("copyrightDa")}
              placeholder='Powered By <a href="https://example.com" target="_blank" rel="noopener noreferrer">Example</a>'
              data-tagid="input-website-footer-copyrightda"
            />
          </Field>
        </div>

        <div className="border-t pt-4">
          <Button
            className="gradient-primary text-primary-foreground"
            onClick={handleSave}
            disabled={update.isPending}
            data-tagid="button-website-footer-save"
          >
            {update.isPending
              ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Saving…</>
              : <><Save className="mr-1.5 h-4 w-4" /> Save Footer</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
