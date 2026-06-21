import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Phone, Clock, Star, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { useBranches } from "@/hooks/useBranches";
import { useCreateReservation } from "@/hooks/useCreateReservation";
import { useCart } from "@/context/CartContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

// Editorial data not stored in the DB
const BRANCH_DISPLAY: Record<string, { rating: number; reviews: number }> = {
  "Hind Indisk Aarhus":     { rating: 4.8, reviews: 2400 },
  "Hind Indisk Copenhagen": { rating: 4.9, reviews: 3100 },
};

export const Route = createFileRoute("/locations")({
  head: () => ({
    meta: [
      { title: "Locations — Hind Indisk Restaurant" },
      { name: "description", content: "Find our restaurants in Aarhus and Copenhagen. Addresses, phone numbers, opening hours and directions." },
      { property: "og:title", content: "Our Locations" },
      { property: "og:description", content: "Visit Hind Indisk in Aarhus or Copenhagen." },
    ],
  }),
  component: LocationsPage,
});

function LocationsPage() {
  const { setBranch } = useCart();
  const { data: branchesData = [] } = useBranches();
  const createReservation = useCreateReservation();

  const [bookingBranch, setBookingBranch] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    branch: "",
    guests: "2",
    date: "",
    time: "19:00",
    name: "",
    phone: "",
    email: "",
    note: "",
  });

  const openBookingModal = (branchName: string) => {
    setForm({ branch: branchName, guests: "2", date: "", time: "19:00", name: "", phone: "", email: "", note: "" });
    setBookingBranch(branchName);
    setDone(false);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedBranch = branchesData.find((b) => b.name === form.branch);
    if (!selectedBranch) return;
    try {
      await createReservation.mutateAsync({
        branchId:       selectedBranch.id,
        date:           form.date,
        timeSlot:       form.time,
        guestCount:     Number(form.guests),
        contactName:    form.name,
        contactPhone:   form.phone,
        contactEmail:   form.email,
        specialRequests: form.note || undefined,
      });
      setDone(true);
    } catch {
      toast.error("Could not save reservation. Please try again.");
    }
  };

  return (
    <Layout>
      <PageHero
        eyebrow="Locations"
        title="Find Your Hind"
        subtitle="Two restaurants, one shared love of authentic Indian cooking."
        image="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1920&q=80"
      />

      <section className="mx-auto max-w-7xl px-6 py-20 space-y-12">
        {branchesData.map((b, i) => {
          const display = BRANCH_DISPLAY[b.name] ?? { rating: 4.8, reviews: 0 };
          return (
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
                  <Star className="h-3.5 w-3.5 fill-primary text-primary" /> {display.rating} · {display.reviews.toLocaleString()} reviews
                </div>
                <div className="mt-6 space-y-3 text-muted-foreground">
                  <div className="flex items-start gap-3"><MapPin className="h-5 w-5 text-primary" /><span>{b.address}, {b.postalCode} {b.city}</span></div>
                  <div className="flex items-center gap-3"><Phone className="h-5 w-5 text-primary" /><span>{b.phone}</span></div>
                  <div className="flex items-center gap-3"><Clock className="h-5 w-5 text-primary" /><span>{b.weekdayHours}</span></div>
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button onClick={() => openBookingModal(b.name)} className="gradient-primary text-primary-foreground cursor-pointer">
                    Book a Table <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                  <Button variant="outline" asChild className="cursor-pointer">
                    <Link to="/menu" onClick={() => setBranch(b.name)}>
                      Order Online
                    </Link>
                  </Button>
                  <Button variant="ghost" asChild className="cursor-pointer">
                    <a href={`https://maps.google.com/?q=${encodeURIComponent(b.address + ", " + b.city)}`} target="_blank" rel="noreferrer">
                      Get Directions
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <Dialog open={bookingBranch !== null} onOpenChange={(open) => { if (!open) { setBookingBranch(null); setDone(false); } }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8">
          {done ? (
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full gradient-primary text-primary-foreground">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="font-display text-2xl font-bold">Reservation Confirmed</h3>
              <p className="text-muted-foreground">
                We can't wait to welcome you at <strong>{form.branch}</strong> on <strong>{form.date}</strong> at <strong>{form.time}</strong>.
              </p>
              <Button className="gradient-primary text-primary-foreground w-full cursor-pointer mt-4" onClick={() => { setBookingBranch(null); setDone(false); }}>
                Done
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">Book a Table</DialogTitle>
                <DialogDescription>
                  Reserve your table at {form.branch}. Quick, easy, and confirmed instantly.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={onSubmit} className="space-y-4 mt-2">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Branch">
                    <Select value={form.branch} onValueChange={(v) => setForm({ ...form, branch: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {branchesData.map((b) => <SelectItem key={b.name} value={b.name}>{b.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Guests">
                    <Select value={form.guests} onValueChange={(v) => setForm({ ...form, guests: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                          <SelectItem key={n} value={String(n)}>{n} {n === 1 ? "guest" : "guests"}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Date">
                    <Input type="date" required value={form.date} min={new Date().toISOString().split("T")[0]} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                  </Field>
                  <Field label="Time">
                    <Input type="time" required value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
                  </Field>
                  <Field label="Full Name">
                    <Input required placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </Field>
                  <Field label="Phone">
                    <Input required type="tel" placeholder="+45 …" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Email">
                      <Input required type="email" placeholder="you@email.dk" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </Field>
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Special Request">
                      <Textarea rows={2} placeholder="Birthday, allergies, seating preference…" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
                    </Field>
                  </div>
                </div>
                <Button size="lg" type="submit" disabled={createReservation.isPending} className="w-full gradient-primary text-primary-foreground mt-2 cursor-pointer">
                  {createReservation.isPending
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirming…</>
                    : "Confirm Reservation"}
                </Button>
                {createReservation.isError && (
                  <p className="text-center text-sm text-destructive">Something went wrong. Please try again.</p>
                )}
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label className="text-sm font-medium">{label}</Label>{children}</div>;
}
