import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAdminBranches } from "@/hooks/useAdminBranches";
import { useUpdateBranch } from "@/hooks/useUpdateBranch";
import { FormPage } from "@/components/admin/FormPage";
import { BranchFields } from "./admin.branches.new";

export const Route = createFileRoute("/admin/branches/$branchId")({ component: BranchEditPage });

type BranchForm = {
  name: string; addressLine1: string; addressLine2: string;
  city: string; postalCode: string; country: string;
  phone: string; email: string; googleMapsLink: string;
  weekdayOpen: string; weekdayClose: string;
  weekendOpen: string; weekendClose: string;
};

function BranchEditPage() {
  const navigate     = useNavigate();
  const { branchId } = Route.useParams();
  const { data: branches = [], isLoading } = useAdminBranches();
  const updateBranch = useUpdateBranch();

  const branch = branches.find(b => String(b.id) === branchId);

  const [form, setForm] = useState<BranchForm>({
    name: "", addressLine1: "", addressLine2: "", city: "", postalCode: "",
    country: "Denmark", phone: "", email: "", googleMapsLink: "",
    weekdayOpen: "11:00", weekdayClose: "22:00",
    weekendOpen: "12:00", weekendClose: "23:00",
  });

  useEffect(() => {
    if (!branch) return;
    setForm({
      name:          branch.name,
      addressLine1:  branch.addressLine1,
      addressLine2:  branch.addressLine2 ?? "",
      city:          branch.city,
      postalCode:    branch.postalCode,
      country:       branch.country,
      phone:         branch.phone,
      email:         branch.email,
      googleMapsLink: branch.googleMapsLink,
      weekdayOpen:   branch.weekdayOpen,
      weekdayClose:  branch.weekdayClose,
      weekendOpen:   branch.weekendOpen,
      weekendClose:  branch.weekendClose,
    });
  }, [branch]);

  const f = (field: keyof BranchForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  if (isLoading) return (
    <div className="flex items-center gap-2 text-muted-foreground py-16">
      <Loader2 className="h-5 w-5 animate-spin" /> Loading…
    </div>
  );

  if (!branch) return <div className="py-16 text-center text-muted-foreground">Branch not found.</div>;

  const handleSave = async () => {
    if (!form.name.trim() || !form.addressLine1.trim()) return;
    try {
      await updateBranch.mutateAsync({
        id: branch.id,
        name: form.name, addressLine1: form.addressLine1,
        addressLine2: form.addressLine2 || undefined,
        city: form.city, postalCode: form.postalCode, country: form.country,
        phone: form.phone, email: form.email, googleMapsLink: form.googleMapsLink,
        weekdayOpen: form.weekdayOpen, weekdayClose: form.weekdayClose,
        weekendOpen: form.weekendOpen, weekendClose: form.weekendClose,
      });
      toast.success(`${form.name} updated.`);
      navigate({ to: "/admin/branches" });
    } catch { toast.error("Failed to update branch."); }
  };

  return (
    <FormPage title={`Edit — ${branch.name}`} subtitle="Update location details and opening hours" backTo="/admin/branches" maxWidth="max-w-2xl">
      <BranchFields form={form} f={f} onSave={handleSave} isSaving={updateBranch.isPending}
        onCancel={() => navigate({ to: "/admin/branches" })} />
    </FormPage>
  );
}
