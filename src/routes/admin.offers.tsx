import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Plus, Pencil, RefreshCcw, ToggleLeft, ToggleRight, Star } from "lucide-react";
import { toast } from "sonner";
import { useAdminOffers, type AdminOfferDto } from "@/hooks/useAdminOffers";
import { useCreateOffer, type CreateOfferInput } from "@/hooks/useCreateOffer";
import { useUpdateOffer } from "@/hooks/useUpdateOffer";
import { useToggleOffer } from "@/hooks/useToggleOffer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/offers")({
  component: AdminOffers,
});

const EMPTY_FORM: CreateOfferInput = {
  title: "",
  description: "",
  discountType: "Percent",
  discountValue: 10,
  couponCode: "",
  minimumOrderAmount: undefined,
  isFirstOrderOnly: false,
  usageLimit: undefined,
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10),
};

function AdminOffers() {
  const { data: offers = [], isLoading, refetch } = useAdminOffers();
  const createOffer  = useCreateOffer();
  const updateOffer  = useUpdateOffer();
  const toggleOffer  = useToggleOffer();

  const [dialog, setDialog]   = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<AdminOfferDto | null>(null);
  const [form, setForm]       = useState<CreateOfferInput>(EMPTY_FORM);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialog("create");
  };

  const openEdit = (offer: AdminOfferDto) => {
    setEditing(offer);
    setForm({
      title:              offer.title,
      description:        offer.description,
      discountType:       offer.discountType,
      discountValue:      offer.discountValue,
      couponCode:         offer.couponCode ?? "",
      minimumOrderAmount: offer.minimumOrderAmount,
      isFirstOrderOnly:   offer.isFirstOrderOnly,
      usageLimit:         offer.usageLimit,
      startDate:          offer.startDate.slice(0, 10),
      endDate:            offer.endDate.slice(0, 10),
    });
    setDialog("edit");
  };

  const handleSave = async () => {
    try {
      if (dialog === "create") {
        await createOffer.mutateAsync(form);
        toast.success("Offer created.");
      } else if (editing) {
        await updateOffer.mutateAsync({ id: editing.id, ...form });
        toast.success("Offer updated.");
      }
      setDialog(null);
    } catch {
      toast.error("Failed to save offer.");
    }
  };

  const handleToggle = async (offer: AdminOfferDto) => {
    try {
      await toggleOffer.mutateAsync(offer.id);
      toast.success(`Offer ${offer.isActive ? "deactivated" : "activated"}.`);
    } catch {
      toast.error("Failed to toggle offer.");
    }
  };

  const discountLabel = (o: AdminOfferDto) => {
    if (o.discountType === "Percent")      return `${o.discountValue}% off`;
    if (o.discountType === "FreeShipping") return "Free delivery";
    return `${o.discountValue} DKK off`;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold">Offers & Coupons</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => refetch()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition">
            <RefreshCcw className="h-4 w-4" /> Refresh
          </button>
          <Button className="gradient-primary text-primary-foreground" size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" /> New offer
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-10">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading offers…
        </div>
      ) : offers.length === 0 ? (
        <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">
          No offers yet.
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map((offer) => (
            <div key={offer.id} className={`rounded-2xl border bg-card p-5 shadow-soft transition ${!offer.isActive ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display text-base font-semibold">{offer.title}</span>
                    {offer.couponCode && (
                      <code className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        {offer.couponCode}
                      </code>
                    )}
                    {offer.isFirstOrderOnly && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                        <Star className="h-3 w-3" /> First Order
                      </span>
                    )}
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      offer.isActive ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                    }`}>
                      {offer.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{offer.description}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                    <span className="font-medium text-foreground">{discountLabel(offer)}</span>
                    {offer.minimumOrderAmount && <span>Min. {offer.minimumOrderAmount} DKK</span>}
                    {offer.usageLimit && <span>Limit: {offer.usageCount}/{offer.usageLimit}</span>}
                    <span>
                      {new Date(offer.startDate).toLocaleDateString("en-DK", { day: "2-digit", month: "short", year: "numeric" })}
                      {" – "}
                      {new Date(offer.endDate).toLocaleDateString("en-DK", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(offer)}>
                    <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={toggleOffer.isPending}
                    onClick={() => handleToggle(offer)}
                    className={offer.isActive ? "text-red-600 border-red-200 hover:bg-red-50" : "text-green-700 border-green-200 hover:bg-green-50"}
                  >
                    {offer.isActive
                      ? <><ToggleRight className="mr-1.5 h-3.5 w-3.5" /> Deactivate</>
                      : <><ToggleLeft className="mr-1.5 h-3.5 w-3.5" /> Activate</>}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialog === "create" ? "New Offer" : `Edit — ${editing?.title}`}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Discount Type</Label>
                <Select value={form.discountType} onValueChange={(v) => setForm({ ...form, discountType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Percent">Percent (%)</SelectItem>
                    <SelectItem value="FixedAmount">Fixed Amount (DKK)</SelectItem>
                    <SelectItem value="FreeShipping">Free Shipping</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>
                  {form.discountType === "Percent" ? "Discount %" : form.discountType === "FreeShipping" ? "—" : "Amount (DKK)"}
                </Label>
                <Input
                  type="number" min={0}
                  disabled={form.discountType === "FreeShipping"}
                  value={form.discountValue}
                  onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Coupon Code (leave blank for auto-apply)</Label>
              <Input
                value={form.couponCode ?? ""}
                onChange={(e) => setForm({ ...form, couponCode: e.target.value.toUpperCase() })}
                placeholder="e.g. SUMMER20"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Min. Order (DKK)</Label>
                <Input
                  type="number" min={0}
                  value={form.minimumOrderAmount ?? ""}
                  onChange={(e) => setForm({ ...form, minimumOrderAmount: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="No minimum"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Usage Limit</Label>
                <Input
                  type="number" min={1}
                  value={form.usageLimit ?? ""}
                  onChange={(e) => setForm({ ...form, usageLimit: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="Unlimited"
                />
              </div>
            </div>
            {/* First Order Only toggle */}
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 hover:bg-muted/30 transition">
              <input
                type="checkbox"
                checked={form.isFirstOrderOnly}
                onChange={(e) => setForm({ ...form, isFirstOrderOnly: e.target.checked })}
                className="mt-0.5 h-4 w-4 accent-primary"
              />
              <div>
                <div className="flex items-center gap-1.5 font-medium text-sm">
                  <Star className="h-3.5 w-3.5 text-amber-500" />
                  First order only
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Only customers with no previous orders can use this offer.
                </p>
              </div>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button
              className="gradient-primary text-primary-foreground"
              disabled={createOffer.isPending || updateOffer.isPending}
              onClick={handleSave}
            >
              {(createOffer.isPending || updateOffer.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {dialog === "create" ? "Create offer" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
