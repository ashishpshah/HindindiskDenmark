import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { useCreateBranch } from "@/hooks/useCreateBranch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormPage } from "@/components/admin/FormPage";
import { ImagePicker } from "@/components/admin/ImagePicker";

export const Route = createFileRoute("/admin/branches/new")({ component: BranchNewPage });

export type BranchForm = {
  name: string; addressLine1: string; addressLine2: string;
  city: string; postalCode: string; country: string;
  phone: string; email: string; googleMapsLink: string;
  imageUrl: string; rating: string; reviewCount: string;
  deliveryEnabled: boolean; pickupEnabled: boolean;
  deliveryFee: string; deliveryFeeEnabled: boolean;
  maxAdvanceDays: string;
};

export const EMPTY_BRANCH: BranchForm = {
  name: "", addressLine1: "", addressLine2: "", city: "", postalCode: "",
  country: "Denmark", phone: "", email: "", googleMapsLink: "",
  imageUrl: "", rating: "5.0", reviewCount: "0",
  deliveryEnabled: true, pickupEnabled: true,
  deliveryFee: "39", deliveryFeeEnabled: true,
  maxAdvanceDays: "7",
};

function BranchNewPage() {
  const navigate = useNavigate();
  const create   = useCreateBranch();
  const [form, setForm] = useState<BranchForm>(EMPTY_BRANCH);

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
        imageUrl: form.imageUrl,
        rating: parseFloat(form.rating) || 5.0,
        reviewCount: parseInt(form.reviewCount) || 0,
        deliveryEnabled: form.deliveryEnabled,
        pickupEnabled: form.pickupEnabled,
        deliveryFee: parseFloat(form.deliveryFee) || 39,
        deliveryFeeEnabled: form.deliveryFeeEnabled,
        maxAdvanceDays: parseInt(form.maxAdvanceDays) || 0,
      });
      toast.success(`${form.name} created.`);
      navigate({ to: "/admin/branches" });
    } catch (e) { toast.error((e as Error).message || "Failed to create branch."); }
  };

  return (
    <FormPage title="Add Branch" subtitle="Set up a new restaurant location" backTo="/admin/branches" maxWidth="max-w-2xl">
      <BranchFields form={form} f={f}
        onImageChange={url => setForm(prev => ({ ...prev, imageUrl: url }))}
        onSave={handleSave} isSaving={create.isPending}
        onCancel={() => navigate({ to: "/admin/branches" })} saveLabel="Create Branch" />
    </FormPage>
  );
}

export function BranchFields({ form, f, onImageChange, onSave, isSaving, onCancel, saveLabel = "Save Changes" }: {
  form: BranchForm;
  f: (field: keyof BranchForm) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageChange: (url: string) => void;
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
        <div className="space-y-1.5"><Label>Phone No.</Label>
          <Input value={form.phone} onChange={f("phone")} type="tel" placeholder="+45 …" /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label>Email</Label>
          <Input value={form.email} onChange={f("email")} type="email" /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label>Google Maps Link</Label>
          <Input value={form.googleMapsLink} onChange={f("googleMapsLink")} placeholder="https://maps.google.com/…" /></div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Branch Photo</Label>
          <ImagePicker value={form.imageUrl} onChange={onImageChange} />
        </div>
        <div className="space-y-1.5"><Label>Rating <span className="text-xs text-muted-foreground">(0–5)</span></Label>
          <Input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={f("rating")} placeholder="4.8" /></div>
        <div className="space-y-1.5"><Label>Review Count</Label>
          <Input type="number" min="0" value={form.reviewCount} onChange={f("reviewCount")} placeholder="0" /></div>
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
