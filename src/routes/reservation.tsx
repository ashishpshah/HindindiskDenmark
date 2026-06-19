import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/Layout";
import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2 } from "lucide-react";
import { branches } from "@/data/mock";

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
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ branch: branches[0].name, guests: "2", date: "", time: "19:00", name: "", phone: "", email: "", note: "" });
  return (
    <Layout>
      <PageHero eyebrow="Reservation" title="Reserve Your Table" subtitle="Skip the wait — your seat is one form away."
        image="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80" />
      <section className="mx-auto max-w-3xl px-6 py-20">
        <form onSubmit={(e) => {
          e.preventDefault();
          try {
            const list = JSON.parse(localStorage.getItem("hind-reservations") || "[]");
            list.unshift({ id: "RES-" + Math.floor(100000 + Math.random() * 900000), ...form, guests: Number(form.guests) });
            localStorage.setItem("hind-reservations", JSON.stringify(list));
          } catch {}
          setDone(true);
        }}
          className="rounded-3xl border bg-card p-8 shadow-elegant space-y-6 sm:p-10">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Branch">
              <Select value={form.branch} onValueChange={(v) => setForm({ ...form, branch: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{branches.map((b) => <SelectItem key={b.name} value={b.name}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Guests">
              <Select value={form.guests} onValueChange={(v) => setForm({ ...form, guests: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{[1,2,3,4,5,6,7,8].map((n) => <SelectItem key={n} value={String(n)}>{n} {n === 1 ? "guest" : "guests"}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Date"><Input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
            <Field label="Time"><Input type="time" required value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></Field>
            <Field label="Full Name"><Input required placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Phone"><Input required type="tel" placeholder="+45 …" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <div className="sm:col-span-2"><Field label="Email"><Input required type="email" placeholder="you@email.dk" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field></div>
            <div className="sm:col-span-2"><Field label="Special Request"><Textarea rows={3} placeholder="Birthday, allergies, seating preference…" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field></div>
          </div>
          <Button size="lg" type="submit" className="w-full gradient-primary text-primary-foreground">Confirm Reservation</Button>
        </form>
      </section>

      <AnimatePresence>
        {done && (
          <>
            <motion.div className="fixed inset-0 z-50 bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDone(false)} />
            <motion.div
              className="fixed left-1/2 top-1/2 z-50 w-[92%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-card p-8 text-center shadow-elegant"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full gradient-primary text-primary-foreground"><CheckCircle2 className="h-8 w-8" /></div>
              <h3 className="mt-5 font-display text-2xl font-bold">Reservation Confirmed</h3>
              <p className="mt-2 text-muted-foreground">A confirmation has been sent to your email. We can't wait to welcome you.</p>
              <Button className="mt-6 gradient-primary text-primary-foreground" onClick={() => setDone(false)}>Done</Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Layout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label className="text-sm font-medium">{label}</Label>{children}</div>;
}
