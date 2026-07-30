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
  name: string; nameDa: string;
  addressLine1: string; addressLine1Da: string;
  addressLine2: string; addressLine2Da: string;
  city: string; cityDa: string;
  postalCode: string; country: string; countryDa: string;
  phone: string; email: string; googleMapsLink: string;
  imageUrl: string; rating: string; reviewCount: string;
  deliveryFee: string; deliveryFeeEnabled: boolean;
  maxAdvanceDays: string;
};

export const EMPTY_BRANCH: BranchForm = {
  name: "", nameDa: "",
  addressLine1: "", addressLine1Da: "",
  addressLine2: "", addressLine2Da: "",
  city: "", cityDa: "",
  postalCode: "", country: "Denmark", countryDa: "Danmark",
  phone: "", email: "", googleMapsLink: "",
  imageUrl: "", rating: "5.0", reviewCount: "0",
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
        name: form.name, nameDa: form.nameDa || undefined,
        addressLine1: form.addressLine1, addressLine1Da: form.addressLine1Da || undefined,
        addressLine2: form.addressLine2 || undefined,
        addressLine2Da: form.addressLine2Da || undefined,
        city: form.city, cityDa: form.cityDa || undefined,
        postalCode: form.postalCode, country: form.country, countryDa: form.countryDa || undefined,
        phone: form.phone, email: form.email, googleMapsLink: form.googleMapsLink,
        imageUrl: form.imageUrl,
        rating: parseFloat(form.rating) || 5.0,
        reviewCount: parseInt(form.reviewCount) || 0,
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
        <div className="space-y-1.5"><Label>Branch Name (EN) *</Label>
          <Input autoFocus value={form.name} onChange={f("name")} placeholder="e.g. Hind Indisk Odense" data-tagid="input-branches-name" /></div>
        <div className="space-y-1.5"><Label>Branch Name (DA)</Label>
          <Input value={form.nameDa} onChange={f("nameDa")} placeholder="f.eks. Hind Indisk Odense" data-tagid="input-branches-nameda" /></div>
        <div className="space-y-1.5"><Label>Address Line 1 (EN) *</Label>
          <Input value={form.addressLine1} onChange={f("addressLine1")} placeholder="Street and number" data-tagid="input-branches-address1" /></div>
        <div className="space-y-1.5"><Label>Address Line 1 (DA)</Label>
          <Input value={form.addressLine1Da} onChange={f("addressLine1Da")} placeholder="Gade og nummer" data-tagid="input-branches-address1da" /></div>
        <div className="space-y-1.5">
          <Label>Address Line 2 (EN) <span className="text-xs text-muted-foreground">(optional)</span></Label>
          <Input value={form.addressLine2} onChange={f("addressLine2")} placeholder="Floor, suite…" data-tagid="input-branches-address2" /></div>
        <div className="space-y-1.5">
          <Label>Address Line 2 (DA) <span className="text-xs text-muted-foreground">(optional)</span></Label>
          <Input value={form.addressLine2Da} onChange={f("addressLine2Da")} placeholder="Etage, suite…" data-tagid="input-branches-address2da" /></div>
        <div className="space-y-1.5"><Label>City (EN) *</Label><Input value={form.city} onChange={f("city")} data-tagid="input-branches-city" /></div>
        <div className="space-y-1.5"><Label>City (DA)</Label><Input value={form.cityDa} onChange={f("cityDa")} data-tagid="input-branches-cityda" /></div>
        <div className="space-y-1.5"><Label>Country (EN)</Label><Input value={form.country} onChange={f("country")} data-tagid="input-branches-country" /></div>
        <div className="space-y-1.5"><Label>Country (DA)</Label><Input value={form.countryDa} onChange={f("countryDa")} data-tagid="input-branches-countryda" /></div>
        <div className="space-y-1.5"><Label>Postal Code *</Label><Input value={form.postalCode} onChange={f("postalCode")} data-tagid="input-branches-postalcode" /></div>
        <div className="space-y-1.5"><Label>Phone No.</Label>
          <Input value={form.phone} onChange={f("phone")} type="tel" placeholder="+45 …" data-tagid="input-branches-phone" /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label>Email</Label>
          <Input value={form.email} onChange={f("email")} type="email" data-tagid="input-branches-email" /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label>Google Maps Link</Label>
          <Input value={form.googleMapsLink} onChange={f("googleMapsLink")} placeholder="https://maps.google.com/…" data-tagid="input-branches-googlemaps" /></div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Branch Photo</Label>
          <ImagePicker value={form.imageUrl} onChange={onImageChange} uploadUrl="/api/admin/upload/branches" />
        </div>
        <div className="space-y-1.5"><Label>Rating <span className="text-xs text-muted-foreground">(0–5)</span></Label>
          <Input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={f("rating")} placeholder="4.8" data-tagid="input-branches-rating" /></div>
        <div className="space-y-1.5"><Label>Review Count</Label>
          <Input type="number" min="0" value={form.reviewCount} onChange={f("reviewCount")} placeholder="0" data-tagid="input-branches-reviewcount" /></div>
      </div>

      <div className="flex gap-2 pt-4 border-t">
        <Button className="gradient-primary text-primary-foreground"
          disabled={!form.name.trim() || !form.addressLine1.trim() || isSaving} onClick={onSave}
          data-tagid="button-branches-save">
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-1.5 h-4 w-4" />}
          {saveLabel}
        </Button>
        <Button variant="outline" onClick={onCancel} data-tagid="button-branches-cancel">Cancel</Button>
      </div>
    </div>
  );
}
