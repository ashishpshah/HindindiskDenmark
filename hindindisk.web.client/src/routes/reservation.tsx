import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/Layout";
import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField } from "@/components/ui/FormField";
import { CheckCircle2, Loader2, Users, UserCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useBranches } from "@/hooks/useBranches";
import { useCreateReservation, type ReservationDto } from "@/hooks/useCreateReservation";
import { useCustomerLookup } from "@/hooks/useCustomerLookup";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { apiFetch } from "@/lib/api/client";
import { useI18n } from "@/i18n/I18nProvider";
import { useAvailableSlots } from "@/hooks/useAvailableSlots";
import { nowInDenmark, todayInDenmark } from "@/lib/denmarkTime";
import type { BranchDto } from "@/hooks/useBranches";

function branchHours(branch: BranchDto | undefined): string | undefined {
  if (!branch) return undefined;
  const parts: string[] = [];
  if (branch.weekdayHours) parts.push(`Mon–Fri: ${branch.weekdayHours}`);
  if (branch.weekendHours) parts.push(`Sat–Sun: ${branch.weekendHours}`);
  return parts.length ? parts.join(" · ") : undefined;
}

const QUICK_CHIPS = [1, 2, 3, 4, 5];
const MAX_GUESTS  = 30;

function GuestPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useI18n();
  const num     = Number(value);
  const isLarge = num >= 6;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {QUICK_CHIPS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(String(n))}
            className={`h-9 w-9 rounded-full border text-sm font-semibold transition-all
              ${num === n
                ? "gradient-primary text-primary-foreground border-transparent shadow-md scale-110"
                : "bg-muted border-border text-muted-foreground hover:bg-accent hover:text-foreground"}`}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          onClick={() => { if (!isLarge) onChange("6"); }}
          className={`h-9 px-3 rounded-full border text-sm font-semibold transition-all flex items-center gap-1
            ${isLarge
              ? "gradient-primary text-primary-foreground border-transparent shadow-md"
              : "bg-muted border-border text-muted-foreground hover:bg-accent hover:text-foreground"}`}
        >
          <Users className="h-3.5 w-3.5" /> 6+
        </button>
      </div>

      {isLarge && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-xl border bg-muted overflow-hidden">
              <button
                type="button"
                disabled={num <= 6}
                onClick={() => onChange(String(num - 1))}
                className="h-10 w-10 flex items-center justify-center text-lg font-bold text-muted-foreground hover:text-foreground hover:bg-accent transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                −
              </button>
              <input
                type="number"
                min={6}
                max={MAX_GUESTS}
                value={value}
                autoFocus
                aria-label="Number of guests"
                onChange={(e) => {
                  const v = Math.min(MAX_GUESTS, Math.max(6, Number(e.target.value) || 6));
                  onChange(String(v));
                }}
                className="w-12 bg-transparent text-center font-semibold text-base focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                disabled={num >= MAX_GUESTS}
                onClick={() => onChange(String(num + 1))}
                className="h-10 w-10 flex items-center justify-center text-lg font-bold text-muted-foreground hover:text-foreground hover:bg-accent transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>
            <span className="text-sm text-muted-foreground">{t("pages.reservation.guestsMax")} {MAX_GUESTS})</span>
          </div>
          {num > 10 && (
            <p className="mt-2 text-xs text-amber-600">
              {t("pages.reservation.largeGroupNote")}
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}

function defaultDate(): string {
  return todayInDenmark();
}

function defaultTime(): string {
  const now = nowInDenmark();
  const remainder = now.getMinutes() % 30;
  const minutesToAdd = remainder === 0 ? 30 : 30 - remainder;
  now.setMinutes(now.getMinutes() + minutesToAdd, 0, 0);
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export const Route = createFileRoute("/reservation")({
  head: () => ({
    meta: [
      { title: "Reservation — Hind Indisk Restaurant" },
      { name: "description", content: "Reserve your table at Hind Indisk in Aarhus or Copenhagen. Quick, easy and confirmed instantly." },
      { property: "og:title", content: "Book a Table" },
      { property: "og:description", content: "Reserve your seat for an authentic Indian dining experience." },
    ],
  }),
  component: ReservationPage,
});

function ReservationPage() {
  const { t } = useI18n();
  const { user }                    = useAuth();
  const { branch: cartBranch, isCloseReservation: ctxCloseReservation } = useCart();
  const { data: branchesData = [] } = useBranches();
  const createReservation           = useCreateReservation();

  const defaultBranch = branchesData[0]?.name ?? "";

  const [confirmed,         setConfirmed]         = useState<ReservationDto | null>(null);
  const [pendingDuplicates, setPendingDuplicates] = useState<ReservationDto[] | null>(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

  const [form, setForm] = useState({
    branch:    defaultBranch,
    guests:    "2",
    date:      defaultDate(),
    time:      defaultTime(),
    firstname: user?.firstname ?? "",
    lastname:  user?.lastname  ?? "",
    phone:     user?.phone     ?? "",
    email:     user?.email     ?? "",
    note:      "",
  });

  useEffect(() => {
    if (!user) return;
    setForm(prev => ({
      ...prev,
      firstname: prev.firstname || user.firstname,
      lastname:  prev.lastname  || user.lastname,
      phone:     prev.phone     || user.phone || "",
      email:     prev.email     || user.email,
    }));
  }, [user]);

  const branchValue = form.branch || cartBranch || branchesData[0]?.name || "";

  const selectedBranchObj = branchesData.find(b => b.name === branchValue);

  // Use CartContext values instantly (no async wait); switch to selectedBranchObj once loaded
  const bannerBranch           = selectedBranchObj?.name ?? cartBranch ?? "";
  const bannerCloseReservation = selectedBranchObj ? selectedBranchObj.isCloseReservation : (bannerBranch === cartBranch && ctxCloseReservation);
  const { isOpen: branchOpen, slots, isLoading: slotsLoading } =
    useAvailableSlots(selectedBranchObj?.id, form.date, "reservation");

  useEffect(() => {
    if (slots.length === 0) return;
    setForm(prev => slots.includes(prev.time) ? prev : { ...prev, time: slots[0] });
  }, [slots]);

  const { data: customer, isFetching: lookingUp, matchedBy } = useCustomerLookup(form.phone, form.email);

  useEffect(() => {
    if (!customer) return;
    setForm(prev => ({
      ...prev,
      firstname: prev.firstname || customer.firstname,
      lastname:  prev.lastname  || customer.lastname,
      email:     prev.email     || customer.email || "",
    }));
  }, [customer]);

  const submitReservation = async () => {
    const selectedBranch = branchesData.find((b) => b.name === branchValue);
    if (!selectedBranch) return;
    try {
      const res = await createReservation.mutateAsync({
        branchId:        selectedBranch.id,
        date:            form.date,
        timeSlot:        form.time,
        guestCount:      Number(form.guests),
        firstname:       form.firstname,
        lastname:        form.lastname,
        phone:           form.phone.trim(),
        email:           form.email.trim(),
        specialRequests: form.note || undefined,
      });
      setPendingDuplicates(null);
      setConfirmed(res);
    } catch (e) {
      toast.error((e as Error).message || t("pages.reservation.failedToCreate"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedBranch = branchesData.find((b) => b.name === branchValue);
    if (!selectedBranch) return;

    // Guests
    const guests = Number(form.guests);
    if (!guests || guests < 1) { toast.error("Please select at least 1 guest."); return; }

    // Date — must not be in the past
    if (!form.date) { toast.error("Please select a date."); return; }
    const today = todayInDenmark();
    if (form.date < today) { toast.error("Reservation date cannot be in the past."); return; }

    // Slots / time
    const hours = branchHours(selectedBranchObj);
    if (slotsLoading) { toast.error(t("forms.loadingSlots")); return; }
    if (!branchOpen)  { toast.error(t("forms.branchClosedDay"), { description: hours }); return; }
    if (slots.length === 0) { toast.error(t("forms.noSlotsAvailable"), { description: hours }); return; }
    if (!form.time || !slots.includes(form.time)) { toast.error(t("forms.selectTimeSlot")); return; }

    // Time not in the past (only relevant for today)
    if (form.date === today) {
      const now = nowInDenmark();
      const [h, m] = form.time.split(":").map(Number);
      const slotDate = new Date(now);
      slotDate.setHours(h, m, 0, 0);
      if (slotDate <= now) { toast.error("Selected time slot has already passed. Please choose a later slot.", { description: hours }); return; }
    }

    // Phone
    if (!form.phone.trim()) {
      toast.error(t("validation.phoneRequired")); return;
    }
    if (!/^\d{8,13}$/.test(form.phone.trim().replace(/[+ ]/g, ""))) {
      toast.error(t("validation.phoneFormat")); return;
    }

    // Email
    if (!form.email.trim()) {
      toast.error(t("validation.emailRequired")); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      toast.error(t("validation.emailFormat")); return;
    }

    setCheckingDuplicate(true);
    try {
      const qs = new URLSearchParams({
        phone:    form.phone.trim(),
        email:    form.email.trim(),
        date:     form.date,
        timeSlot: form.time,
      });
      const dupes = await apiFetch<ReservationDto[]>(`/api/reservations/check-duplicate?${qs}`);
      if (dupes.length > 0) {
        setPendingDuplicates(dupes);
        return;
      }
    } catch {
      // if check fails, proceed anyway
    } finally {
      setCheckingDuplicate(false);
    }

    await submitReservation();
  };

  const handleDone = () => {
    setConfirmed(null);
    setForm({
      branch:    branchesData[0]?.name ?? "",
      guests:    "2",
      date:      defaultDate(),
      time:      defaultTime(),
      firstname: "",
      lastname:  "",
      phone:     "",
      email:     "",
      note:      "",
    });
  };

  const isPending = createReservation.isPending || checkingDuplicate;

  return (
    <Layout>
      <PageHero
        eyebrow={t("pages.reservation.eyebrow")}
        title={t("pages.reservation.title")}
        subtitle={t("pages.reservation.subtitle")}
        image="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80"
      />

      {bannerCloseReservation && (
        <div className="border-b border-orange-200 bg-orange-50 py-3">
          <div className="mx-auto max-w-7xl px-6 flex items-center gap-2 text-sm text-orange-700">
            <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
            <span><strong>{bannerBranch}</strong> is not accepting reservations at the moment.</span>
          </div>
        </div>
      )}

      <section className="mx-auto max-w-3xl px-6 py-20">
        <form onSubmit={handleSubmit}
          className="rounded-3xl border bg-card p-8 shadow-elegant space-y-6 sm:p-10">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label={t("forms.branchLabel")}>
              <Select value={branchValue} onValueChange={(v) => setForm({ ...form, branch: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {branchesData.map((b) => (
                    <SelectItem key={b.name} value={b.name}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label={t("forms.guestsLabel")}>
              <GuestPicker value={form.guests} onChange={(v) => setForm({ ...form, guests: v })} />
            </FormField>
          </div>

          {selectedBranchObj?.isCloseReservation ? (
            <div className="rounded-2xl border border-orange-200 bg-orange-50 px-6 py-8 text-center space-y-2">
              <p className="text-lg font-semibold text-orange-700">Reservations temporarily suspended</p>
              <p className="text-sm text-orange-600">
                This branch is not accepting new reservations at the moment. Please try again later or contact us directly.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label={t("forms.dateLabel")}>
                  <Input type="date" required
                    min={todayInDenmark()}
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </FormField>

                <FormField label={t("forms.timeLabel")}>
                  {slotsLoading ? (
                    <p className="text-sm text-muted-foreground py-2">{t("forms.loadingSlots")}</p>
                  ) : !branchOpen ? (
                    <div className="py-2 space-y-0.5">
                      <p className="text-sm text-destructive">{t("forms.branchClosedDay")}</p>
                      {branchHours(selectedBranchObj) && <p className="text-xs text-muted-foreground">{branchHours(selectedBranchObj)}</p>}
                    </div>
                  ) : slots.length > 0 ? (
                    <Select value={form.time} onValueChange={(v) => setForm({ ...form, time: v })}>
                      <SelectTrigger className="rounded-full">
                        <SelectValue placeholder={t("forms.timeLabel")} />
                      </SelectTrigger>
                      <SelectContent>
                        {slots.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="py-2 space-y-0.5">
                      <p className="text-sm text-destructive">{t("forms.noSlotsAvailable")}</p>
                      {branchHours(selectedBranchObj) && <p className="text-xs text-muted-foreground">{branchHours(selectedBranchObj)}</p>}
                    </div>
                  )}
                </FormField>

                <div className="sm:col-span-2">
                  <FormField label={t("forms.specialRequestLabel")}>
                    <Textarea rows={3} placeholder={t("forms.specialRequestPlaceholder")}
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })} />
                  </FormField>
                </div>

                <div className="sm:col-span-2">
                  <div className="relative">
                    <FormField label={t("forms.phoneLabel")}>
                      <Input
                        required
                        type="tel"
                        placeholder={t("forms.phonePlaceholder")}
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      />
                    </FormField>
                    {lookingUp && matchedBy !== "email" && (
                      <Loader2 className="absolute right-3 top-9 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {customer && !lookingUp && matchedBy === "phone" && (
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-green-600">
                        <UserCheck className="h-3.5 w-3.5" />
                        {t("forms.customerFound")}
                      </div>
                    )}
                  </div>
                </div>

                <FormField label={t("forms.firstNameLabel")}>
                  <Input placeholder={t("forms.firstNamePlaceholder")} value={form.firstname}
                    onChange={(e) => setForm({ ...form, firstname: e.target.value })} />
                </FormField>

                <FormField label={t("forms.lastNameLabel")}>
                  <Input placeholder={t("forms.lastNamePlaceholder")} value={form.lastname}
                    onChange={(e) => setForm({ ...form, lastname: e.target.value })} />
                </FormField>

                <div className="sm:col-span-2">
                  <div className="relative">
                    <FormField label={t("forms.emailLabel")}>
                      <Input type="email" required placeholder={t("forms.emailPlaceholder")} value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </FormField>
                    {lookingUp && matchedBy !== "phone" && (
                      <Loader2 className="absolute right-3 top-9 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {customer && !lookingUp && matchedBy === "email" && (
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-green-600">
                        <UserCheck className="h-3.5 w-3.5" />
                        {t("forms.customerFound")}
                      </div>
                    )}
                  </div>
                </div>

              </div>

              <Button size="lg" type="submit" disabled={isPending || slotsLoading || !branchOpen || slots.length === 0}
                className="w-full gradient-primary text-primary-foreground">
                {isPending
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {checkingDuplicate ? t("pages.reservation.checkingBtn") : t("pages.reservation.confirmingBtn")}</>
                  : t("pages.reservation.confirmBtn")}
              </Button>

              {createReservation.isError && (
                <p className="text-center text-sm text-destructive">
                  {t("pages.reservation.somethingWrong")}
                </p>
              )}
            </>
          )}
        </form>
      </section>

      <AnimatePresence>

        {/* ── Duplicate warning dialog ─────────────────────────────────────── */}
        {pendingDuplicates && pendingDuplicates.length > 0 && (
          <>
            <motion.div className="fixed inset-0 z-50 bg-black/60"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setPendingDuplicates(null)} />
            <motion.div
              className="fixed left-1/2 top-1/2 z-50 w-[92%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-card p-8 shadow-elegant"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-amber-100 text-amber-600 mb-4">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <h3 className="font-display text-xl font-bold text-center">{t("modals.duplicateTitle")}</h3>
              <p className="mt-2 text-sm text-muted-foreground text-center">
                {pendingDuplicates.length === 1
                  ? t("modals.duplicateDescSingle")
                  : t("modals.duplicateDescMultiple")}
              </p>

              <div className="mt-4 space-y-2">
                {pendingDuplicates.map(r => (
                  <div key={r.id} className="rounded-xl border bg-accent/40 px-4 py-3 text-sm space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{r.contactName}</span>
                      <span className="font-mono text-xs text-muted-foreground">#{r.id}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {r.branchName} · {r.date} at {r.timeSlot} · {r.guestCount} guest{r.guestCount !== 1 ? "s" : ""}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setPendingDuplicates(null)}
                >
                  {t("modals.goBack")}
                </Button>
                <Button
                  className="flex-1 gradient-primary text-primary-foreground"
                  disabled={createReservation.isPending}
                  onClick={submitReservation}
                >
                  {createReservation.isPending
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("modals.booking")}</>
                    : t("modals.bookAnyway")}
                </Button>
              </div>
            </motion.div>
          </>
        )}

        {/* ── Confirmation dialog ───────────────────────────────────────────── */}
        {confirmed && (
          <>
            <motion.div className="fixed inset-0 z-50 bg-black/60"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={handleDone} />
            <motion.div
              className="fixed left-1/2 top-1/2 z-50 w-[92%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-card p-8 text-center shadow-elegant"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full gradient-primary text-primary-foreground">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="mt-5 font-display text-2xl font-bold">{t("modals.reservationConfirmed")}</h3>
              <p className="mt-1 font-mono text-sm text-muted-foreground">#{confirmed.id}</p>
              <div className="mt-4 rounded-2xl bg-accent/50 p-4 text-sm text-left space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">{t("common.branch")}</span><span className="font-medium">{confirmed.branchName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t("forms.dateLabel")}</span><span className="font-medium">{confirmed.date}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t("forms.timeLabel")}</span><span className="font-medium">{confirmed.timeSlot}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t("forms.guestsLabel")}</span><span className="font-medium">{confirmed.guestCount}</span></div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{t("modals.reservationWelcome")}</p>
              <Button className="mt-6 gradient-primary text-primary-foreground" onClick={handleDone}>{t("modals.confirmDone")}</Button>
            </motion.div>
          </>
        )}

      </AnimatePresence>
    </Layout>
  );
}
