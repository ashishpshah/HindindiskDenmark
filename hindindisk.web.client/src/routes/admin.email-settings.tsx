import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Loader2, Mail, Server, User, Send, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api/client";
import { useAdminEmailSettings, useUpdateEmailSettings, type EmailSettingsDto } from "@/hooks/useEmailSettings";
import { useAdminEmailRecipients, useUpdateEmailRecipients } from "@/hooks/useEmailRecipients";
import { useServiceStatus } from "@/hooks/useServiceStatus";
import { BranchPicker } from "@/components/admin/BranchPicker";

export const Route = createFileRoute("/admin/email-settings")({ component: EmailSettingsPage });

type Draft = Partial<EmailSettingsDto> & { smtpPass?: string };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}

function EmailSettingsPage() {
  const { data: settings, isLoading } = useAdminEmailSettings();
  const update = useUpdateEmailSettings();
  const [draft, setDraft] = useState<Draft>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmPwd, setConfirmPwd] = useState("");
  const [confirmError, setConfirmError] = useState("");

  const branchesQ   = useServiceStatus();
  const branches    = branchesQ.data ?? [];
  const recipientsQ = useAdminEmailRecipients();
  const updateRecipients = useUpdateEmailRecipients();
  const [selectedBranchId, setSelectedBranchId] = useState<number>();
  const branchId = selectedBranchId ?? branches[0]?.id;
  const recipients = recipientsQ.data?.find(r => r.branchId === branchId);

  const [adminToMail, setAdminToMail] = useState("");
  const [cc, setCc]                   = useState("");
  const [bcc, setBcc]                 = useState("");

  useEffect(() => {
    if (recipients) {
      setAdminToMail(recipients.adminToMail);
      setCc(recipients.cc);
      setBcc(recipients.bcc);
    }
  }, [recipients]);

  function saveRecipients() {
    if (!branchId) return;
    updateRecipients.mutate({ branchId, adminToMail, cc, bcc }, {
      onSuccess: () => toast.success("Admin recipients saved"),
      onError:   () => toast.error("Failed to save recipients"),
    });
  }

  function val<K extends keyof EmailSettingsDto>(key: K): EmailSettingsDto[K] {
    return (draft[key] !== undefined ? draft[key] : settings?.[key]) as EmailSettingsDto[K];
  }

  function set<K extends keyof Draft>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setDraft(p => ({ ...p, [key]: key === "smtpPort" ? Number(e.target.value) : e.target.value }));
  }

  function toggleEnabled() {
    setDraft(p => ({ ...p, enabled: !(p.enabled !== undefined ? p.enabled : settings?.enabled) }));
  }

  const isEnabled = draft.enabled !== undefined ? draft.enabled : (settings?.enabled ?? false);

  async function doSave() {
    if (!settings) return;
    const payload: Draft = {
      smtpHost:    val("smtpHost"),
      smtpPort:    val("smtpPort"),
      smtpUser:    val("smtpUser"),
      fromName:    val("fromName"),
      fromAddress: val("fromAddress"),
      enabled:     isEnabled,
    };
    if (draft.smtpPass?.trim()) payload.smtpPass = draft.smtpPass.trim();
    await update.mutateAsync(payload as Parameters<typeof update.mutateAsync>[0]);
    toast.success("Email settings saved");
    setDraft({});
  }

  async function handleSave() {
    if (draft.smtpPass?.trim()) {
      setShowConfirm(true);
      return;
    }
    await doSave();
  }

  async function handleConfirmSave() {
    setConfirmError("");
    try {
      await apiFetch("/api/auth/verify-password", {
        method: "POST",
        body: JSON.stringify({ password: confirmPwd }),
      });
      await doSave();
      setShowConfirm(false);
      setConfirmPwd("");
    } catch {
      setConfirmError("Current password is incorrect.");
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Email Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Configure SMTP server and sender details for outgoing emails.</p>
        </div>
        <div
          className="flex items-center gap-2 cursor-pointer select-none"
          onClick={toggleEnabled}
          data-tagid="button-email-settings-toggle"
          title={isEnabled ? "Disable email sending" : "Enable email sending"}
        >
          {isEnabled
            ? <ToggleRight className="h-7 w-7 text-green-600" />
            : <ToggleLeft  className="h-7 w-7 text-muted-foreground" />}
          <span className={`text-sm font-medium ${isEnabled ? "text-green-600" : "text-muted-foreground"}`}>
            {isEnabled ? "Enabled" : "Disabled"}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border bg-card shadow-soft divide-y">

        {/* SMTP Server */}
        <div className="p-6 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Server className="h-4 w-4 text-primary" /> SMTP Server
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="SMTP Host">
              <Input value={val("smtpHost") ?? ""} onChange={set("smtpHost")} placeholder="smtp.gmail.com" data-tagid="input-email-settings-smtphost" />
            </Field>
            <Field label="SMTP Port">
              <Input type="number" value={val("smtpPort") ?? 587} onChange={set("smtpPort")} placeholder="587" data-tagid="input-email-settings-smtpport" />
            </Field>
          </div>
        </div>

        <div className="border-t" />

        {/* Authentication */}
        <div className="p-6 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <User className="h-4 w-4 text-primary" /> Authentication
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="SMTP Username">
              <Input value={val("smtpUser") ?? ""} onChange={set("smtpUser")} placeholder="user@gmail.com" autoComplete="off" data-tagid="input-email-settings-smtpuser" />
            </Field>
            <Field label="SMTP Password">
              <Input
                type="password"
                value={draft.smtpPass ?? ""}
                onChange={e => setDraft(p => ({ ...p, smtpPass: e.target.value }))}
                placeholder="Leave blank to keep current password"
                autoComplete="new-password"
                data-tagid="input-email-settings-smtppass"
              />
              <p className="text-xs text-muted-foreground">Password is never shown. Enter a new value only to change it.</p>
            </Field>
          </div>
        </div>

        <div className="border-t" />

        {/* Sender Details */}
        <div className="p-6 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" /> Sender Details
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="From Name">
              <Input value={val("fromName") ?? ""} onChange={set("fromName")} placeholder="Hind Indisk Restaurant" data-tagid="input-email-settings-fromname" />
            </Field>
            <Field label="From Address">
              <Input value={val("fromAddress") ?? ""} onChange={set("fromAddress")} placeholder="noreply@hindindisk.dk" data-tagid="input-email-settings-fromaddress" />
            </Field>
          </div>
        </div>

        <div className="border-t" />

        {/* Admin Recipients */}
        <div className="p-6 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" /> Admin Recipients
          </h3>
          <p className="text-xs text-muted-foreground -mt-2">
            Who gets notified about new orders/reservations for each branch. Configured per branch — pick a branch below.
          </p>

          <BranchPicker branches={branches} value={selectedBranchId ?? branches[0]?.id} onChange={setSelectedBranchId} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Admin To Mail">
              <Input value={adminToMail} onChange={e => setAdminToMail(e.target.value)} placeholder="admin@hindindisk.dk" data-tagid="input-email-settings-admintomail" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="CC (comma-separated)">
                <Input value={cc} onChange={e => setCc(e.target.value)} placeholder="cc1@example.com, cc2@example.com" data-tagid="input-email-settings-cc" />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="BCC (comma-separated)">
                <Input value={bcc} onChange={e => setBcc(e.target.value)} placeholder="bcc@example.com" data-tagid="input-email-settings-bcc" />
              </Field>
            </div>
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={saveRecipients}
            disabled={updateRecipients.isPending || !branchId}
            data-tagid="button-email-settings-recipients-save"
          >
            {updateRecipients.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</> : "Save Admin Recipients"}
          </Button>
        </div>

        {/* Footer */}
        <div className="border-t p-6">
          <Button
            onClick={handleSave}
            disabled={update.isPending}
            className="gradient-primary text-primary-foreground"
            data-tagid="button-email-settings-save"
          >
            {update.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</> : "Save Email Settings"}
          </Button>
        </div>
      </div>

      {/* Password confirmation dialog */}
      {showConfirm && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowConfirm(false)} data-tagid="button-email-settings-backdrop" />
          <div className="fixed left-1/2 top-1/2 z-50 w-[94%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-card p-6 shadow-2xl space-y-4">
            <h3 className="font-display text-lg font-semibold">Confirm your password</h3>
            <p className="text-sm text-muted-foreground">
              You are changing the SMTP password. Enter your current account password to confirm.
            </p>
            <Input
              type="password"
              placeholder="Your current password"
              value={confirmPwd}
              onChange={e => { setConfirmPwd(e.target.value); setConfirmError(""); }}
              autoFocus
              data-tagid="input-email-settings-confirmpwd"
            />
            {confirmError && (
              <p className="text-sm text-destructive">{confirmError}</p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setShowConfirm(false); setConfirmPwd(""); setConfirmError(""); }} data-tagid="button-email-settings-cancelconfirm">
                Cancel
              </Button>
              <Button onClick={handleConfirmSave} disabled={update.isPending || !confirmPwd} className="gradient-primary text-primary-foreground" data-tagid="button-email-settings-confirmsave">
                {update.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</> : "Confirm & Save"}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
