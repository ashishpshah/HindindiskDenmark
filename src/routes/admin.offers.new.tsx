import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Check, Star } from "lucide-react";
import { toast } from "sonner";
import { useCreateOffer, type CreateOfferInput } from "@/hooks/useCreateOffer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormPage } from "@/components/admin/FormPage";

export const Route = createFileRoute("/admin/offers/new")({ component: OfferNewPage });

const EMPTY_BASE: Omit<CreateOfferInput, "startDate" | "endDate"> = {
  title: "", description: "", discountType: "Percent", discountValue: 10,
  couponCode: "", minimumOrderAmount: undefined, isFirstOrderOnly: false,
  usageLimit: undefined,
};

// B4 fixed: dates computed inside initializer so they always reflect "today"
function freshDates() {
  return {
    startDate: new Date().toISOString().slice(0, 10),
    endDate:   new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10),
  };
}

function OfferNewPage() {
  const navigate = useNavigate();
  const create   = useCreateOffer();
  const [form, setForm] = useState<CreateOfferInput>(() => ({ ...EMPTY_BASE, ...freshDates() }));

  const handleSave = async () => {
    if (!form.title.trim()) return;
    try {
      await create.mutateAsync(form);
      toast.success("Offer created.");
      navigate({ to: "/admin/offers" });
    } catch { toast.error("Failed to create offer."); }
  };

  return (
    <FormPage title="Create Offer" subtitle="Add a new promotion or coupon" backTo="/admin/offers">
      <OfferFormFields form={form} setForm={setForm} onSave={handleSave} isSaving={create.isPending}
        onCancel={() => navigate({ to: "/admin/offers" })} saveLabel="Create Offer" />
    </FormPage>
  );
}

export function OfferFormFields({ form, setForm, onSave, isSaving, onCancel, saveLabel = "Save Changes" }: {
  form: CreateOfferInput;
  setForm: React.Dispatch<React.SetStateAction<CreateOfferInput>>;
  onSave: () => void; isSaving: boolean; onCancel: () => void; saveLabel?: string;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Title *</Label>
          <Input autoFocus value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Summer Special" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Description</Label>
          <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description" />
        </div>
        <div className="space-y-1.5">
          <Label>Discount Type</Label>
          <Select value={form.discountType} onValueChange={v => setForm(f => ({ ...f, discountType: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Percent">Percent (%)</SelectItem>
              <SelectItem value="FixedAmount">Fixed Amount (DKK)</SelectItem>
              <SelectItem value="FreeShipping">Free Shipping</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{form.discountType === "Percent" ? "Discount %" : form.discountType === "FreeShipping" ? "—" : "Amount (DKK)"}</Label>
          <Input type="number" min={0} disabled={form.discountType === "FreeShipping"}
            value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: Number(e.target.value) }))} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Coupon Code <span className="text-xs text-muted-foreground">(blank = auto-apply)</span></Label>
          <Input value={form.couponCode ?? ""} placeholder="e.g. SUMMER20"
            onChange={e => setForm(f => ({ ...f, couponCode: e.target.value.toUpperCase() }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Min. Order (DKK)</Label>
          <Input type="number" min={0} value={form.minimumOrderAmount ?? ""} placeholder="No minimum"
            onChange={e => setForm(f => ({ ...f, minimumOrderAmount: e.target.value ? Number(e.target.value) : undefined }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Usage Limit</Label>
          <Input type="number" min={1} value={form.usageLimit ?? ""} placeholder="Unlimited"
            onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value ? Number(e.target.value) : undefined }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Start Date</Label>
          <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>End Date</Label>
          <Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 hover:bg-muted/30 transition">
        <input type="checkbox" checked={form.isFirstOrderOnly} className="mt-0.5 h-4 w-4 accent-primary"
          onChange={e => setForm(f => ({ ...f, isFirstOrderOnly: e.target.checked }))} />
        <div>
          <div className="flex items-center gap-1.5 font-medium text-sm"><Star className="h-3.5 w-3.5 text-amber-500" /> First order only</div>
          <p className="mt-0.5 text-xs text-muted-foreground">Only customers with no previous orders can use this offer.</p>
        </div>
      </label>

      <div className="flex gap-2 pt-4 border-t">
        <Button className="gradient-primary text-primary-foreground"
          disabled={!form.title.trim() || isSaving} onClick={onSave}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-1.5 h-4 w-4" />}
          {saveLabel}
        </Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
