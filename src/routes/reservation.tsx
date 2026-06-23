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
import { apiFetch } from "@/lib/api/client";

const QUICK_CHIPS = [1, 2, 3, 4, 5];
const MAX_GUESTS  = 30;

function GuestPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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
            <span className="text-sm text-muted-foreground">guests (max {MAX_GUESTS})</span>
          </div>
          {num > 10 && (
            <p className="mt-2 text-xs text-amber-600">
              For large groups we may contact you to confirm seating arrangements.
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
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
  const { data: branchesData = [] } = useBranches();
  const createReservation           = useCreateReservation();

  const defaultBranch = branchesData[0]?.name ?? "";

  const [confirmed,         setConfirmed]         = useState<ReservationDto | null>(null);
  const [pendingDuplicates, setPendingDuplicates] = useState<ReservationDto[] | null>(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

  const [form, setForm] = useState({
    branch:    defaultBranch,
    guests:    "2",
    date:      "",
    time:      "19:00",
    firstname: "",
    lastname:  "",
    phone:     "",
    email:     "",
    note:      "",
  });

  const branchValue = form.branch || branchesData[0]?.name || "";

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

  // ── Shared submit (called directly or after "Book Anyway") ────────────────

  const submitReservation = async () => {
    const selectedBranch = branchesData.find((b) => b.name === branchValue);
    if (!selectedBranch) return;
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
  };

  // ── Primary submit handler ─────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedBranch = branchesData.find((b) => b.name === branchValue);
    if (!selectedBranch) return;

    if (!form.phone.trim()) {
      toast.error("Please enter your phone number."); return;
    }
    if (!/^\+?[0-9]{8,15}$/.test(form.phone.trim())) {
      toast.error("Phone must contain only digits with an optional + prefix and no spaces (e.g. +4512345678)."); return;
    }
    if (!form.email.trim()) {
      toast.error("Please enter your email."); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      toast.error("Please enter a valid email address."); return;
    }

    // Duplicate check
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

  // ── Reset form after confirmation ──────────────────────────────────────────

  const handleDone = () => {
    setConfirmed(null);
    setForm({
      branch:    branchesData[0]?.name ?? "",
      guests:    "2",
      date:      "",
      time:      "19:00",
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
      <PageHero eyebrow="Reservation" title="Reserve Your Table"
        subtitle="Skip the wait — your seat is one form away."
        image="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80" />

      <section className="mx-auto max-w-3xl px-6 py-20">
        <form onSubmit={handleSubmit}
          className="rounded-3xl border bg-card p-8 shadow-elegant space-y-6 sm:p-10">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Branch">
              <Select value={branchValue} onValueChange={(v) => setForm({ ...form, branch: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {branchesData.map((b) => (
                    <SelectItem key={b.name} value={b.name}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Guests">
              <GuestPicker value={form.guests} onChange={(v) => setForm({ ...form, guests: v })} />
            </FormField>

            <FormField label="Date">
              <Input type="date" required
                min={new Date().toISOString().split("T")[0]}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </FormField>

            <FormField label="Time">
              <Input type="time" required value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })} />
            </FormField>

            {/* Phone — primary lookup trigger (8+ digits, 600ms debounce) */}
            <div className="sm:col-span-2">
              <div className="relative">
                <FormField label="Phone *">
                  <Input
                    required
                    type="tel"
                    placeholder="+45 …"
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
                    Customer found — details filled in
                  </div>
                )}
              </div>
            </div>

            <FormField label="First name *">
              <Input required placeholder="First name" value={form.firstname}
                onChange={(e) => setForm({ ...form, firstname: e.target.value })} />
            </FormField>

            <FormField label="Last name *">
              <Input required placeholder="Last name" value={form.lastname}
                onChange={(e) => setForm({ ...form, lastname: e.target.value })} />
            </FormField>

            {/* Email — fallback lookup trigger when phone has < 8 digits */}
            <div className="sm:col-span-2">
              <div className="relative">
                <FormField label="Email *">
                  <Input type="email" required placeholder="you@email.dk" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </FormField>
                {lookingUp && matchedBy !== "phone" && (
                  <Loader2 className="absolute right-3 top-9 h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {customer && !lookingUp && matchedBy === "email" && (
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-green-600">
                    <UserCheck className="h-3.5 w-3.5" />
                    Customer found — details filled in
                  </div>
                )}
              </div>
            </div>

            <div className="sm:col-span-2">
              <FormField label="Special Request">
                <Textarea rows={3} placeholder="Birthday, allergies, seating preference…"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })} />
              </FormField>
            </div>
          </div>

          <Button size="lg" type="submit" disabled={isPending}
            className="w-full gradient-primary text-primary-foreground">
            {isPending
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {checkingDuplicate ? "Checking…" : "Confirming…"}</>
              : "Confirm Reservation"}
          </Button>

          {createReservation.isError && (
            <p className="text-center text-sm text-destructive">
              Something went wrong. Please try again.
            </p>
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
              <h3 className="font-display text-xl font-bold text-center">Reservation Already Exists</h3>
              <p className="mt-2 text-sm text-muted-foreground text-center">
                We found {pendingDuplicates.length === 1 ? "a reservation" : `${pendingDuplicates.length} reservations`} matching
                the phone, email, date &amp; time you entered:
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
                  Go Back
                </Button>
                <Button
                  className="flex-1 gradient-primary text-primary-foreground"
                  disabled={createReservation.isPending}
                  onClick={submitReservation}
                >
                  {createReservation.isPending
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Booking…</>
                    : "Book Anyway"}
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
              <h3 className="mt-5 font-display text-2xl font-bold">Reservation Confirmed</h3>
              <p className="mt-1 font-mono text-sm text-muted-foreground">#{confirmed.id}</p>
              <div className="mt-4 rounded-2xl bg-accent/50 p-4 text-sm text-left space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Branch</span><span className="font-medium">{confirmed.branchName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{confirmed.date}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span className="font-medium">{confirmed.timeSlot}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Guests</span><span className="font-medium">{confirmed.guestCount}</span></div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">We can't wait to welcome you!</p>
              <Button className="mt-6 gradient-primary text-primary-foreground" onClick={handleDone}>Done</Button>
            </motion.div>
          </>
        )}

      </AnimatePresence>
    </Layout>
  );
}
