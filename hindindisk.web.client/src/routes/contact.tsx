import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone, MapPin,
  Loader2, Star, ArrowRight, CheckCircle2, AlertTriangle, Users, UserCheck,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/ui/FormField";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useBranches } from "@/hooks/useBranches";
import { useCreateReservation, type ReservationDto } from "@/hooks/useCreateReservation";
import { useCustomerLookup } from "@/hooks/useCustomerLookup";
import { useAvailableSlots } from "@/hooks/useAvailableSlots";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api/client";
import { useI18n } from "@/i18n/I18nProvider";
import { nowInDenmark, todayInDenmark } from "@/lib/denmarkTime";

const WorldMap = lazy(() =>
  import("@/components/ui/map").then((m) => ({ default: m.WorldMap }))
);

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact & Locations — Hind Indisk Restaurant" },
      { name: "description", content: "Get in touch with Hind Indisk. Phone, email, social channels, addresses and maps for Aarhus and Copenhagen." },
      { property: "og:title", content: "Contact & Locations" },
      { property: "og:description", content: "We'd love to hear from you." },
    ],
  }),
  component: ContactPage,
});

// ── GuestPicker ────────────────────────────────────────────────────────────────

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
          <button key={n} type="button" onClick={() => onChange(String(n))}
            className={`h-9 w-9 rounded-full border text-sm font-semibold transition-all
              ${num === n
                ? "gradient-primary text-primary-foreground border-transparent shadow-md scale-110"
                : "bg-muted border-border text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
            {n}
          </button>
        ))}
        <button type="button" onClick={() => { if (!isLarge) onChange("6"); }}
          className={`h-9 px-3 rounded-full border text-sm font-semibold transition-all flex items-center gap-1
            ${isLarge
              ? "gradient-primary text-primary-foreground border-transparent shadow-md"
              : "bg-muted border-border text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
          <Users className="h-3.5 w-3.5" /> 6+
        </button>
      </div>
      <AnimatePresence>
        {isLarge && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-xl border bg-muted overflow-hidden">
                <button type="button" disabled={num <= 6} onClick={() => onChange(String(num - 1))}
                  className="h-10 w-10 flex items-center justify-center text-lg font-bold text-muted-foreground hover:text-foreground hover:bg-accent transition disabled:opacity-30 disabled:cursor-not-allowed">−</button>
                <input type="number" min={6} max={MAX_GUESTS} value={value} autoFocus
                  aria-label="Number of guests"
                  onChange={(e) => { const v = Math.min(MAX_GUESTS, Math.max(6, Number(e.target.value) || 6)); onChange(String(v)); }}
                  className="w-12 bg-transparent text-center font-semibold text-base focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                <button type="button" disabled={num >= MAX_GUESTS} onClick={() => onChange(String(num + 1))}
                  className="h-10 w-10 flex items-center justify-center text-lg font-bold text-muted-foreground hover:text-foreground hover:bg-accent transition disabled:opacity-30 disabled:cursor-not-allowed">+</button>
              </div>
              <span className="text-sm text-muted-foreground">{t("pages.reservation.guestsMax")} {MAX_GUESTS})</span>
            </div>
            {num > 10 && <p className="mt-2 text-xs text-amber-600">{t("pages.reservation.largeGroupNote")}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function defaultDate(): string { return todayInDenmark(); }

function defaultTime(): string {
  const now = nowInDenmark();
  const rem = now.getMinutes() % 30;
  now.setMinutes(now.getMinutes() + (rem === 0 ? 30 : 30 - rem), 0, 0);
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

// ── Contact form state ─────────────────────────────────────────────────────────

const EMPTY_CONTACT = { name: "", email: "", subject: "", message: "" };

// ── Page ──────────────────────────────────────────────────────────────────────

function ContactPage() {
  const { t } = useI18n();
  const { setBranch } = useCart();
  const { data: branchesData = [] } = useBranches();
  const createReservation = useCreateReservation();

  // Contact form
  const [contactForm,    setContactForm]    = useState(EMPTY_CONTACT);
  const [sending,        setSending]        = useState(false);
  const [contactResult,  setContactResult]  = useState<{ success: boolean; message: string } | null>(null);

  const setField = (k: keyof typeof contactForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setContactForm(prev => ({ ...prev, [k]: value }));
    };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await apiFetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(contactForm) });
      setContactResult({ success: true, message: t("pages.contact.sendSuccess") });
      setContactForm(EMPTY_CONTACT);
    } catch (err: unknown) {
      setContactResult({ success: false, message: err instanceof Error ? err.message : t("pages.contact.sendError") });
    } finally {
      setSending(false);
    }
  };

  // Booking modal
  const [bookingBranch,     setBookingBranch]     = useState<string | null>(null);
  const [done,              setDone]              = useState(false);
  const [pendingDuplicates, setPendingDuplicates] = useState<ReservationDto[] | null>(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

  const [bookingForm, setBookingForm] = useState({
    branch: "", guests: "2", date: defaultDate(), time: defaultTime(),
    firstname: "", lastname: "", phone: "", email: "", note: "",
  });

  const { data: customer, isFetching: lookingUp, matchedBy } =
    useCustomerLookup(bookingForm.phone, bookingForm.email);

  useEffect(() => {
    if (!customer) return;
    setBookingForm(prev => ({
      ...prev,
      firstname: prev.firstname || customer.firstname,
      lastname:  prev.lastname  || customer.lastname,
      email:     prev.email     || customer.email || "",
    }));
  }, [customer]);

  const modalBranchObj = branchesData.find(b => b.name === bookingForm.branch);
  const { isOpen: branchOpen, slots, isLoading: slotsLoading } =
    useAvailableSlots(modalBranchObj?.id, bookingForm.date, "reservation");

  useEffect(() => {
    if (slots.length === 0) return;
    setBookingForm(prev => slots.includes(prev.time) ? prev : { ...prev, time: slots[0] });
  }, [slots]);

  const openBookingModal = (branchName: string) => {
    setBookingForm({ branch: branchName, guests: "2", date: defaultDate(), time: defaultTime(), firstname: "", lastname: "", phone: "", email: "", note: "" });
    setBookingBranch(branchName);
    setPendingDuplicates(null);
    setDone(false);
  };

  const closeModal = () => { setBookingBranch(null); setDone(false); setPendingDuplicates(null); };

  const submitReservation = async () => {
    const selectedBranch = branchesData.find(b => b.name === bookingForm.branch);
    if (!selectedBranch) return;
    try {
      await createReservation.mutateAsync({
        branchId:        selectedBranch.id,
        date:            bookingForm.date,
        timeSlot:        bookingForm.time,
        guestCount:      Number(bookingForm.guests),
        firstname:       bookingForm.firstname,
        lastname:        bookingForm.lastname,
        phone:           bookingForm.phone.trim(),
        email:           bookingForm.email.trim() || undefined,
        specialRequests: bookingForm.note || undefined,
      });
      setPendingDuplicates(null);
      setDone(true);
    } catch (e) {
      toast.error((e as Error).message || t("pages.reservation.failedToCreate"));
    }
  };

  const onBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.phone.trim()) { toast.error(t("validation.phoneRequired")); return; }
    if (!/^\d{8,13}$/.test(bookingForm.phone.trim().replace(/[+ ]/g, ""))) { toast.error(t("validation.phoneFormat")); return; }
    if (bookingForm.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookingForm.email.trim())) { toast.error(t("validation.emailFormat")); return; }

    setCheckingDuplicate(true);
    try {
      const qs = new URLSearchParams({ phone: bookingForm.phone.trim(), email: bookingForm.email.trim(), date: bookingForm.date, timeSlot: bookingForm.time });
      const dupes = await apiFetch<ReservationDto[]>(`/api/reservations/check-duplicate?${qs}`);
      if (dupes.length > 0) { setPendingDuplicates(dupes); return; }
    } catch { /* proceed on check failure */ } finally { setCheckingDuplicate(false); }

    await submitReservation();
  };

  const isPending = createReservation.isPending || checkingDuplicate;

  return (
    <Layout>
      <PageHero
        eyebrow={t("pages.contact.eyebrow")}
        title={t("pages.contact.title")}
        subtitle={t("pages.contact.subtitle")}
        image="https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1920&q=80"
      />

      {/* ── Contact form + quick info ───────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-6 py-20">
        <form onSubmit={handleContactSubmit} className="space-y-5 rounded-3xl border bg-card p-8 shadow-elegant">
          <h2 className="font-display text-3xl font-bold">{t("pages.contact.formTitle")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("pages.contact.nameLabel")}</Label>
              <Input required placeholder={t("pages.contact.namePlaceholder")} value={contactForm.name} onChange={setField("name")} />
            </div>
            <div className="space-y-2">
              <Label>{t("profile.email")}</Label>
              <Input required type="email" placeholder={t("forms.emailPlaceholder")} value={contactForm.email} onChange={setField("email")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("pages.contact.subjectLabel")}</Label>
            <Input placeholder={t("pages.contact.subjectPlaceholder")} value={contactForm.subject} onChange={setField("subject")} />
          </div>
          <div className="space-y-2">
            <Label>{t("pages.contact.messageLabel")}</Label>
            <Textarea rows={6} required placeholder={t("pages.contact.messagePlaceholder")} value={contactForm.message} onChange={setField("message")} />
          </div>
          <Button size="lg" type="submit" disabled={sending} className="w-full gradient-primary text-primary-foreground">
            {sending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("pages.contact.sendingBtn")}</> : t("pages.contact.sendBtn")}
          </Button>
        </form>
      </section>

      {/* ── Branch locations with maps (merged from /locations) ─────────────── */}
      <section className="mx-auto max-w-7xl px-6 pb-20 space-y-12">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">{t("pages.locations.eyebrow")}</span>
          <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">{t("pages.locations.title")}</h2>
          <p className="mt-4 text-muted-foreground">{t("pages.locations.subtitle")}</p>
        </div>

        {branchesData.map((b, i) => (
          <div key={b.name} className={`grid gap-10 lg:grid-cols-2 lg:items-center ${i % 2 ? "lg:[&>*:first-child]:order-2" : ""}`}>
            <div className="aspect-[4/3] overflow-hidden rounded-3xl shadow-elegant">
              <iframe
                title={b.name}
                className="h-full w-full grayscale-[20%]"
                src={`https://www.google.com/maps?q=${encodeURIComponent(b.address + ", " + b.city)}&output=embed`}
                loading="lazy"
              />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">{b.city}</div>
              <h2 className="mt-3 font-display text-4xl font-bold">{b.name}</h2>
              <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-sm">
                <Star className="h-3.5 w-3.5 fill-primary text-primary" /> {b.rating} · {b.reviewCount.toLocaleString()} {t("pages.locations.reviewsLabel")}
              </div>
              <div className="mt-6 space-y-3 text-muted-foreground">
                <div className="flex items-start gap-3"><MapPin className="h-5 w-5 text-primary" /><span>{b.address}, {b.postalCode} {b.city}</span></div>
                <div className="flex items-center gap-3"><Phone className="h-5 w-5 text-primary" /><span>{b.phone}</span></div>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button onClick={() => openBookingModal(b.name)} className="gradient-primary text-primary-foreground cursor-pointer">
                  {t("pages.locations.bookBtn")} <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
                <Button variant="outline" asChild className="cursor-pointer">
                  <Link to="/menu" onClick={() => setBranch(b.name)}>{t("pages.locations.orderBtn")}</Link>
                </Button>
                <Button variant="ghost" asChild className="cursor-pointer">
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(b.address + ", " + b.city)}`} target="_blank" rel="noreferrer">
                    {t("pages.locations.directionsBtn")}
                  </a>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ── Booking modal ───────────────────────────────────────────────────── */}
      <Dialog open={bookingBranch !== null} onOpenChange={(open) => { if (!open) closeModal(); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8">
          {done ? (
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full gradient-primary text-primary-foreground">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="font-display text-2xl font-bold">{t("modals.reservationConfirmed")}</h3>
              <p className="text-muted-foreground">
                {t("modals.reservationWelcomeAt")} <strong>{bookingForm.branch}</strong> on <strong>{bookingForm.date}</strong> at <strong>{bookingForm.time}</strong>.
              </p>
              <Button className="gradient-primary text-primary-foreground w-full cursor-pointer mt-4" onClick={closeModal}>
                {t("modals.confirmDone")}
              </Button>
            </div>
          ) : pendingDuplicates ? (
            <div className="py-4 space-y-4">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-amber-100 text-amber-600">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <h3 className="font-display text-xl font-bold text-center">{t("modals.duplicateTitle")}</h3>
              <p className="text-sm text-muted-foreground text-center">
                {pendingDuplicates.length === 1 ? t("modals.duplicateDescSingle") : t("modals.duplicateDescMultiple")}
              </p>
              <div className="space-y-2">
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
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setPendingDuplicates(null)}>{t("modals.goBack")}</Button>
                <Button className="flex-1 gradient-primary text-primary-foreground" disabled={createReservation.isPending} onClick={submitReservation}>
                  {createReservation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("modals.booking")}</> : t("modals.bookAnyway")}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">{t("modals.bookTitle")}</DialogTitle>
                <DialogDescription>{t("modals.bookDesc")}</DialogDescription>
              </DialogHeader>
              <form onSubmit={onBookingSubmit} className="space-y-4 mt-2">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label={t("forms.branchLabel")}>
                    <Select value={bookingForm.branch} onValueChange={(v) => setBookingForm({ ...bookingForm, branch: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {branchesData.map(b => <SelectItem key={b.name} value={b.name}>{b.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label={t("forms.guestsLabel")}>
                    <GuestPicker value={bookingForm.guests} onChange={(v) => setBookingForm({ ...bookingForm, guests: v })} />
                  </FormField>
                </div>

                {modalBranchObj?.isCloseReservation ? (
                  <div className="rounded-2xl border border-orange-200 bg-orange-50 px-5 py-6 text-center space-y-1">
                    <p className="font-semibold text-orange-700">Reservations temporarily suspended</p>
                    <p className="text-sm text-orange-600">This branch is not accepting new reservations at the moment. Please try again later or contact us directly.</p>
                  </div>
                ) : (
                <><div className="grid gap-4 sm:grid-cols-2">
                  <FormField label={t("forms.dateLabel")}>
                    <Input type="date" required value={bookingForm.date} min={todayInDenmark()}
                      onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })} />
                  </FormField>
                  <FormField label={t("forms.timeLabel")}>
                    {slotsLoading ? (
                      <p className="text-sm text-muted-foreground py-2">{t("forms.loadingSlots")}</p>
                    ) : !branchOpen ? (
                      <p className="text-sm text-destructive py-2">{t("forms.branchClosedDay")}</p>
                    ) : slots.length > 0 ? (
                      <Select value={bookingForm.time} onValueChange={(v) => setBookingForm({ ...bookingForm, time: v })}>
                        <SelectTrigger className="rounded-full"><SelectValue placeholder={t("forms.timeLabel")} /></SelectTrigger>
                        <SelectContent>{slots.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-destructive py-2">{t("forms.noSlotsAvailable")}</p>
                    )}
                  </FormField>

                  <div className="sm:col-span-2">
                    <div className="relative">
                      <FormField label={t("forms.phoneLabel")}>
                        <Input required type="tel" placeholder={t("forms.phonePlaceholder")} value={bookingForm.phone}
                          onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })} />
                      </FormField>
                      {lookingUp && matchedBy !== "email" && <Loader2 className="absolute right-3 top-9 h-4 w-4 animate-spin text-muted-foreground" />}
                      {customer && !lookingUp && matchedBy === "phone" && (
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-green-600"><UserCheck className="h-3.5 w-3.5" /> {t("forms.customerFound")}</div>
                      )}
                    </div>
                  </div>

                  <FormField label={t("forms.firstNameLabel")}>
                    <Input required placeholder={t("forms.firstNamePlaceholder")} value={bookingForm.firstname}
                      onChange={(e) => setBookingForm({ ...bookingForm, firstname: e.target.value })} />
                  </FormField>
                  <FormField label={t("forms.lastNameLabel")}>
                    <Input required placeholder={t("forms.lastNamePlaceholder")} value={bookingForm.lastname}
                      onChange={(e) => setBookingForm({ ...bookingForm, lastname: e.target.value })} />
                  </FormField>

                  <div className="sm:col-span-2">
                    <div className="relative">
                      <FormField label={t("forms.emailOptionalLabel")}>
                        <Input type="email" placeholder={t("forms.emailPlaceholder")} value={bookingForm.email}
                          onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })} />
                      </FormField>
                      {lookingUp && matchedBy !== "phone" && <Loader2 className="absolute right-3 top-9 h-4 w-4 animate-spin text-muted-foreground" />}
                      {customer && !lookingUp && matchedBy === "email" && (
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-green-600"><UserCheck className="h-3.5 w-3.5" /> {t("forms.customerFound")}</div>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <FormField label={t("forms.specialRequestLabel")}>
                      <Textarea rows={2} placeholder={t("forms.specialRequestPlaceholder")}
                        value={bookingForm.note} onChange={(e) => setBookingForm({ ...bookingForm, note: e.target.value })} />
                    </FormField>
                  </div>
                </div>
                <Button size="lg" type="submit" disabled={isPending} className="w-full gradient-primary text-primary-foreground mt-2 cursor-pointer">
                  {isPending
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{checkingDuplicate ? t("pages.reservation.checkingBtn") : t("pages.reservation.confirmingBtn")}</>
                    : t("pages.reservation.confirmBtn")}
                </Button>
                {createReservation.isError && <p className="text-center text-sm text-destructive">{t("pages.reservation.somethingWrong")}</p>}
                </>
                )}
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── World Map ───────────────────────────────────────────────────────── */}
      <section className="bg-surface py-20 border-t">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">{t("pages.contact.journeyLabel")}</span>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">{t("pages.contact.journeyTitle")}</h2>
            <p className="mt-4 text-muted-foreground">{t("pages.contact.journeyDesc")}</p>
          </div>
          <div className="rounded-[2rem] border bg-card p-6 md:p-8 shadow-elegant overflow-hidden min-h-[300px] flex items-center justify-center">
            <Suspense fallback={
              <div className="text-muted-foreground text-sm flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
                {t("pages.contact.mapLoading")}
              </div>
            }>
              <WorldMap
                lineColor="#ea580c"
                dots={[
                  { start: { lat: 28.6139, lng: 77.209, label: "New Delhi (India)", labelPosition: "top" }, end: { lat: 56.1522, lng: 10.2064, label: "Aarhus (Denmark)", labelPosition: "left" } },
                  { start: { lat: 28.6139, lng: 77.209, label: "New Delhi (India)", labelPosition: "top" }, end: { lat: 55.6761, lng: 12.5683, label: "Copenhagen (Denmark)", labelPosition: "right" } },
                ]}
              />
            </Suspense>
          </div>
        </div>
      </section>
      {/* ── Contact result dialog ──────────────────────────────────────────── */}
      <Dialog open={contactResult !== null} onOpenChange={(open) => { if (!open) setContactResult(null); }}>
        <DialogContent className="max-w-sm rounded-3xl p-8 text-center">
          <div className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${contactResult?.success ? "gradient-primary text-primary-foreground" : "bg-destructive/10 text-destructive"}`}>
            {contactResult?.success
              ? <CheckCircle2 className="h-8 w-8" />
              : <AlertTriangle className="h-8 w-8" />
            }
          </div>
          <DialogHeader className="mt-4 space-y-1">
            <DialogTitle className="font-display text-xl">
              {contactResult?.success ? "Message Received." : "Failed to Send"}
            </DialogTitle>
            <DialogDescription>{contactResult?.message}</DialogDescription>
          </DialogHeader>
          <Button className="mt-6 w-full gradient-primary text-primary-foreground" onClick={() => setContactResult(null)}>
            {contactResult?.success ? "Done" : "Close"}
          </Button>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
