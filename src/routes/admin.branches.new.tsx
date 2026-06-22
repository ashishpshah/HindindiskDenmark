import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { useCreateBranch } from "@/hooks/useCreateBranch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormPage } from "@/components/admin/FormPage";

export const Route = createFileRoute("/admin/branches/new")({ component: BranchNewPage });

type BranchForm = {
  name: string; addressLine1: string; addressLine2: string;
  city: string; postalCode: string; country: string;
  phone: string; email: string; googleMapsLink: string;
  weekdayOpen: string; weekdayClose: string;
  weekendOpen: string; weekendClose: string;
};

const EMPTY: BranchForm = {
  name: "", addressLine1: "", addressLine2: "", city: "", postalCode: "",
  country: "Denmark", phone: "", email: "", googleMapsLink: "",
  weekdayOpen: "11:00", weekdayClose: "22:00",
  weekendOpen: "12:00", weekendClose: "23:00",
};

function BranchNewPage() {
  const navigate = useNavigate();
  const create   = useCreateBranch();
  const [form, setForm] = useState<BranchForm>(EMPTY);

  const f = (field: keyof BranchForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.addressLine1.trim()) return;
    try {
      await create.mutateAsync({
        name: form.name, addressLine1: form.addressLine1,
        addressLine2: form.addressLine2 || undefined,
        city: form.city, postalCode: form.postalCode, country: form.country,
        phone: form.phone, email: form.email, googleMapsLink: form.googleMapsLink,
        weekdayOpen: form.weekdayOpen, weekdayClose: form.weekdayClose,
        weekendOpen: form.weekendOpen, weekendClose: form.weekendClose,
      });
      toast.success(`${form.name} created.`);
      navigate({ to: "/admin/branches" });
    } catch { toast.error("Failed to create branch."); }
  };

  return (
    <FormPage title="Add Branch" subtitle="Set up a new restaurant location" backTo="/admin/branches" maxWidth="max-w-2xl">
      <BranchFields form={form} f={f} onSave={handleSave} isSaving={create.isPending}
        onCancel={() => navigate({ to: "/admin/branches" })} saveLabel="Create Branch" />
    </FormPage>
  );
}

export function BranchFields({ form, f, onSave, isSaving, onCancel, saveLabel = "Save Changes" }: {
  form: BranchForm;
  f: (field: keyof BranchForm) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void; isSaving: boolean; onCancel: () => void; saveLabel?: string;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2"><Label>Branch Name *</Label>
          <Input autoFocus value={form.name} onChange={f("name")} placeholder="e.g. Hind Indisk Odense" /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label>Address Line 1 *</Label>
          <Input value={form.addressLine1} onChange={f("addressLine1")} placeholder="Street and number" /></div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Address Line 2 <span className="text-xs text-muted-foreground">(optional)</span></Label>
          <Input value={form.addressLine2} onChange={f("addressLine2")} placeholder="Floor, suite…" /></div>
        <div className="space-y-1.5"><Label>City *</Label><Input value={form.city} onChange={f("city")} /></div>
        <div className="space-y-1.5"><Label>Postal Code *</Label><Input value={form.postalCode} onChange={f("postalCode")} /></div>
        <div className="space-y-1.5"><Label>Country</Label><Input value={form.country} onChange={f("country")} /></div>
        <div className="space-y-1.5"><Label>Phone</Label>
          <Input value={form.phone} onChange={f("phone")} type="tel" placeholder="+45 …" /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label>Email</Label>
          <Input value={form.email} onChange={f("email")} type="email" /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label>Google Maps Link</Label>
          <Input value={form.googleMapsLink} onChange={f("googleMapsLink")} placeholder="https://maps.google.com/…" /></div>

        <div className="sm:col-span-2 space-y-2">
          <Label>Opening Hours</Label>
          <div className="space-y-2">
            <div className="rounded-xl border bg-muted/20 p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Mon – Fri</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 space-y-1"><Label className="text-xs text-muted-foreground">Open</Label>
                  <Input type="time" value={form.weekdayOpen} onChange={f("weekdayOpen")} /></div>
                <span className="text-muted-foreground text-sm mt-5">–</span>
                <div className="flex-1 space-y-1"><Label className="text-xs text-muted-foreground">Close</Label>
                  <Input type="time" value={form.weekdayClose} onChange={f("weekdayClose")} /></div>
              </div>
            </div>
            <div className="rounded-xl border bg-muted/20 p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Sat – Sun</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 space-y-1"><Label className="text-xs text-muted-foreground">Open</Label>
                  <Input type="time" value={form.weekendOpen} onChange={f("weekendOpen")} /></div>
                <span className="text-muted-foreground text-sm mt-5">–</span>
                <div className="flex-1 space-y-1"><Label className="text-xs text-muted-foreground">Close</Label>
                  <Input type="time" value={form.weekendClose} onChange={f("weekendClose")} /></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-4 border-t">
        <Button className="gradient-primary text-primary-foreground"
          disabled={!form.name.trim() || !form.addressLine1.trim() || isSaving} onClick={onSave}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-1.5 h-4 w-4" />}
          {saveLabel}
        </Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
