import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAdminBranches } from "@/hooks/useAdminBranches";
import { useUpdateBranch } from "@/hooks/useUpdateBranch";
import { FormPage } from "@/components/admin/FormPage";
import { BranchFields, type BranchForm, EMPTY_BRANCH } from "./admin.branches.new";

export const Route = createFileRoute("/admin/branches/$branchId")({ component: BranchEditPage });

function BranchEditPage() {
  const navigate      = useNavigate();
  const { branchId }  = Route.useParams();
  const branchIdNum   = Number(branchId);

  const { data: branches = [], isLoading } = useAdminBranches();
  const updateBranch = useUpdateBranch();

  const branch = branches.find(b => String(b.id) === branchId);

  // ── Branch Info form ───────────────────────────────────────────────────────
  const [form, setForm] = useState<BranchForm>(EMPTY_BRANCH);

  useEffect(() => {
    if (!branch) return;
    setForm({
      name:           branch.name,
      nameDa:         branch.nameDa ?? "",
      addressLine1:   branch.addressLine1,
      addressLine1Da: branch.addressLine1Da ?? "",
      addressLine2:   branch.addressLine2 ?? "",
      addressLine2Da: branch.addressLine2Da ?? "",
      city:           branch.city,
      cityDa:         branch.cityDa ?? "",
      postalCode:     branch.postalCode,
      country:        branch.country,
      countryDa:      branch.countryDa ?? "",
      phone:          branch.phone,
      email:          branch.email,
      googleMapsLink:   branch.googleMapsLink,
      imageUrl:         branch.imageUrl,
      rating:           String(branch.rating),
      reviewCount:      String(branch.reviewCount),
      deliveryFee:        String(branch.deliveryFee),
      deliveryFeeEnabled: branch.deliveryFeeEnabled,
      bagCharge:          String(branch.bagCharge),
      bagChargeEnabled:   branch.bagChargeEnabled,
      maxAdvanceDays:     String(branch.maxAdvanceDays),
    });
  }, [branch]);

  const f = (field: keyof BranchForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.addressLine1.trim()) return;
    try {
      await updateBranch.mutateAsync({
        id: branchIdNum,
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
        deliveryFee:        parseFloat(form.deliveryFee) || 39,
        deliveryFeeEnabled: form.deliveryFeeEnabled,
        bagCharge:          parseFloat(form.bagCharge) || 0,
        bagChargeEnabled:   form.bagChargeEnabled,
        maxAdvanceDays:     parseInt(form.maxAdvanceDays) || 0,
      });
      toast.success(`${form.name} updated.`);
      navigate({ to: "/admin/branches" });
    } catch (e) { toast.error((e as Error).message || "Failed to update branch."); }
  };

  if (isLoading) return (
    <div className="flex items-center gap-2 text-muted-foreground py-16">
      <Loader2 className="h-5 w-5 animate-spin" /> Loading…
    </div>
  );

  if (!branch) return <div className="py-16 text-center text-muted-foreground">Branch not found.</div>;

  return (
    <FormPage
      title={`Edit — ${branch.name}`}
      subtitle="Update location details"
      backTo="/admin/branches"
      maxWidth="max-w-3xl"
    >
      <BranchFields form={form} f={f}
        onImageChange={url => setForm(prev => ({ ...prev, imageUrl: url }))}
        onSave={handleSave} isSaving={updateBranch.isPending}
        onCancel={() => navigate({ to: "/admin/branches" })} />
    </FormPage>
  );
}
