import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAdminOffers } from "@/hooks/useAdminOffers";
import { useUpdateOffer } from "@/hooks/useUpdateOffer";
import type { CreateOfferInput } from "@/hooks/useCreateOffer";
import { FormPage } from "@/components/admin/FormPage";
import { OfferFormFields } from "./admin.offers.new";

export const Route = createFileRoute("/admin/offers/$offerId")({ component: OfferEditPage });

function OfferEditPage() {
  const navigate    = useNavigate();
  const { offerId } = Route.useParams();
  const { data: offers = [], isLoading } = useAdminOffers();
  const updateOffer = useUpdateOffer();

  const offer = offers.find(o => String(o.id) === offerId);

  const [form, setForm] = useState<CreateOfferInput>({
    title: "", description: "", discountType: "Percent", discountValue: 10,
    couponCode: "", minimumOrderAmount: undefined, isFirstOrderOnly: false,
    usageLimit: undefined,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10),
  });

  useEffect(() => {
    if (!offer) return;
    setForm({
      title: offer.title, description: offer.description,
      discountType: offer.discountType, discountValue: offer.discountValue,
      couponCode: offer.couponCode ?? "", minimumOrderAmount: offer.minimumOrderAmount,
      isFirstOrderOnly: offer.isFirstOrderOnly, usageLimit: offer.usageLimit,
      startDate: offer.startDate.slice(0, 10), endDate: offer.endDate.slice(0, 10),
    });
  }, [offer]);

  if (isLoading) return (
    <div className="flex items-center gap-2 text-muted-foreground py-16">
      <Loader2 className="h-5 w-5 animate-spin" /> Loading…
    </div>
  );

  if (!offer) return <div className="py-16 text-center text-muted-foreground">Offer not found.</div>;

  const handleSave = async () => {
    try {
      await updateOffer.mutateAsync({ id: offer.id, ...form });
      toast.success("Offer updated.");
      navigate({ to: "/admin/offers" });
    } catch { toast.error("Failed to update offer."); }
  };

  return (
    <FormPage title={`Edit — ${offer.title}`} subtitle="Update offer details" backTo="/admin/offers">
      <OfferFormFields
        form={form} setForm={setForm}
        onSave={handleSave} isSaving={updateOffer.isPending}
        onCancel={() => navigate({ to: "/admin/offers" })}
      />
    </FormPage>
  );
}
