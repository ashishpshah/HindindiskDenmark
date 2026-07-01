import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import {
  useAddresses, useAddAddress, useUpdateAddress, useDeleteAddress,
  type AddressDto, type SaveAddressInput,
} from "@/hooks/useAddresses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/account/addresses")({ component: AddressesPage });

const EMPTY: SaveAddressInput = {
  addressLine1: "",
  addressLine2: "",
  city:         "",
  postalCode:   "",
  country:      "Denmark",
  type:         "Home",
};

function AddressesPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { data: addresses = [], isLoading } = useAddresses(!!user);
  const addAddress    = useAddAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();

  const [dialog,  setDialog]  = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<AddressDto | null>(null);
  const [form,    setForm]    = useState<SaveAddressInput>(EMPTY);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY);
    setDialog("add");
  };

  const openEdit = (addr: AddressDto) => {
    setEditing(addr);
    setForm({
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 ?? "",
      city:         addr.city,
      postalCode:   addr.postalCode,
      country:      addr.country,
      type:         addr.type,
    });
    setDialog("edit");
  };

  const handleSave = async () => {
    try {
      if (dialog === "add") {
        await addAddress.mutateAsync(form);
        toast.success(t("pages.addresses.addedToast"));
      } else if (editing) {
        await updateAddress.mutateAsync({ id: editing.id, ...form });
        toast.success(t("pages.addresses.updatedToast"));
      }
      setDialog(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("pages.addresses.saveError"));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteAddress.mutateAsync(id);
      toast.success(t("pages.addresses.removedToast"));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("pages.addresses.deleteError"));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold">{t("pages.addresses.title")}</h2>
        <Button size="sm" className="gradient-primary text-primary-foreground" onClick={openAdd}>
          <Plus className="mr-1.5 h-4 w-4" /> {t("pages.addresses.addBtn")}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-8">
          <Loader2 className="h-5 w-5 animate-spin" /> {t("account.loading")}
        </div>
      ) : addresses.length === 0 ? (
        <div className="rounded-3xl border bg-card p-8 text-center text-muted-foreground">
          {t("pages.addresses.empty")}
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div key={addr.id} className="rounded-3xl border bg-card p-5 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-semibold">{addr.type}</div>
                    <div className="text-sm text-muted-foreground">
                      {addr.addressLine1}
                      {addr.addressLine2 && `, ${addr.addressLine2}`}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {addr.postalCode} {addr.city}, {addr.country}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(addr)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm" variant="ghost"
                    className="text-destructive hover:text-destructive"
                    disabled={deleteAddress.isPending}
                    onClick={() => handleDelete(addr.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{dialog === "add" ? t("pages.addresses.newTitle") : t("pages.addresses.editTitle")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t("pages.addresses.typeLabel")}</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Home">{t("pages.addresses.typeHome")}</SelectItem>
                  <SelectItem value="Office">{t("pages.addresses.typeOffice")}</SelectItem>
                  <SelectItem value="Other">{t("pages.addresses.typeOther")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("pages.addresses.line1Label")}</Label>
              <Input
                value={form.addressLine1}
                onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                placeholder={t("pages.addresses.line1Placeholder")}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("pages.addresses.line2Label")}</Label>
              <Input
                value={form.addressLine2 ?? ""}
                onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
                placeholder={t("pages.addresses.line2Placeholder")}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("pages.addresses.cityLabel")}</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder={t("pages.addresses.cityPlaceholder")}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("pages.addresses.postalLabel")}</Label>
                <Input
                  value={form.postalCode}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                  placeholder={t("pages.addresses.postalPlaceholder")}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("pages.addresses.countryLabel")}</Label>
              <Input
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>{t("actions.cancel")}</Button>
            <Button
              className="gradient-primary text-primary-foreground"
              disabled={addAddress.isPending || updateAddress.isPending}
              onClick={handleSave}
            >
              {(addAddress.isPending || updateAddress.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {dialog === "add" ? t("pages.addresses.addBtn") : t("pages.addresses.saveBtn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
