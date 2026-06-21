import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useUpdateProfile } from "@/hooks/useUpdateProfile";
import { toast } from "sonner";

export const Route = createFileRoute("/account/profile")({ component: ProfilePage });

function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const updateMutation = useUpdateProfile();

  const [form, setForm] = useState(() => {
    const parts = (user?.name ?? "").split(" ");
    return {
      firstname: parts[0] ?? "",
      lastname:  parts.slice(1).join(" ") ?? "",
      email:     user?.email ?? "",
      phone:     user?.phone ?? "",
    };
  });

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await updateMutation.mutateAsync({
        firstname: form.firstname,
        lastname:  form.lastname,
        phone:     form.phone || undefined,
      });
      updateProfile({
        name:  `${updated.firstname} ${updated.lastname}`.trim(),
        phone: updated.phone || undefined,
      });
      toast.success("Profile saved.");
    } catch {
      toast.error("Failed to save profile.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border bg-card p-8 shadow-soft space-y-5">
      <h2 className="font-display text-2xl font-semibold">Profile</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First Name">
          <Input value={form.firstname} onChange={(e) => setForm({ ...form, firstname: e.target.value })} required />
        </Field>
        <Field label="Last Name">
          <Input value={form.lastname} onChange={(e) => setForm({ ...form, lastname: e.target.value })} />
        </Field>
        <Field label="Email">
          <Input type="email" value={form.email} disabled className="bg-muted/50 cursor-not-allowed" />
        </Field>
        <Field label="Phone">
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+45 …" />
        </Field>
      </div>
      <Button className="gradient-primary text-primary-foreground" disabled={updateMutation.isPending}>
        {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save changes
      </Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
