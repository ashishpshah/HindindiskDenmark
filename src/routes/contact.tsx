import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter } from "lucide-react";
import { Layout } from "@/components/Layout";
import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { branches } from "@/data/mock";
import { toast } from "sonner";
import { lazy, Suspense } from "react";

const WorldMap = lazy(() =>
  import("@/components/ui/map").then((m) => ({ default: m.WorldMap }))
);

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Hind Indisk Restaurant" },
      { name: "description", content: "Get in touch with Hind Indisk. Phone, email, social channels and addresses for both Aarhus and Copenhagen." },
      { property: "og:title", content: "Contact Us" },
      { property: "og:description", content: "We'd love to hear from you." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <Layout>
      <PageHero eyebrow="Contact" title="Say Hello" subtitle="Questions, bookings, feedback — we read every message."
        image="https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1920&q=80" />
      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-2">
        <form onSubmit={(e) => { e.preventDefault(); toast.success("Message sent. We'll reply within 24h."); }}
          className="space-y-5 rounded-3xl border bg-card p-8 shadow-elegant">
          <h2 className="font-display text-3xl font-bold">Send a message</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Name</Label><Input required placeholder="Your name" /></div>
            <div className="space-y-2"><Label>Email</Label><Input required type="email" placeholder="you@email.dk" /></div>
          </div>
          <div className="space-y-2"><Label>Subject</Label><Input placeholder="What's it about?" /></div>
          <div className="space-y-2"><Label>Message</Label><Textarea rows={6} required placeholder="How can we help?" /></div>
          <Button size="lg" type="submit" className="w-full gradient-primary text-primary-foreground">Send Message</Button>
        </form>
        <div className="space-y-6">
          <div className="rounded-3xl border bg-card p-6 shadow-soft">
            <h3 className="font-display text-xl font-semibold">Reach Us</h3>
            <div className="mt-4 space-y-3 text-muted-foreground">
              <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-primary" /> +45 86 12 34 56</div>
              <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-primary" /> hello@hindindisk.dk</div>
            </div>
            <div className="mt-4 flex gap-3">
              {[Facebook, Instagram, Twitter].map((Icon, i) => (
                <a key={i} href="#" className="grid h-10 w-10 place-items-center rounded-full border hover:border-primary hover:text-primary"><Icon className="h-4 w-4" /></a>
              ))}
            </div>
          </div>
          {branches.map((b) => (
            <div key={b.name} className="rounded-3xl border bg-card p-6 shadow-soft">
              <h3 className="font-display text-xl font-semibold">{b.name}</h3>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2"><MapPin className="h-4 w-4 text-primary mt-0.5" /> {b.address}</div>
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> {b.phone}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* World Map Section showing Indian Spice Journey */}
      <section className="bg-surface py-20 border-t">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">From India to Denmark</span>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Our Culinary Journey</h2>
            <p className="mt-4 text-muted-foreground">
              Tracing our authentic spices, traditions, and heritage from New Delhi straight to our kitchens in Aarhus and Copenhagen.
            </p>
          </div>
          <div className="rounded-[2rem] border bg-card p-6 md:p-8 shadow-elegant overflow-hidden min-h-[300px] flex items-center justify-center">
            <Suspense fallback={
              <div className="text-muted-foreground text-sm flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
                Loading culinary journey map...
              </div>
            }>
              <WorldMap
                lineColor="#ea580c"
                dots={[
                  {
                    start: { lat: 28.6139, lng: 77.209, label: "New Delhi (India)", labelPosition: "top" },
                    end: { lat: 56.1522, lng: 10.2064, label: "Aarhus (Denmark)", labelPosition: "left" }
                  },
                  {
                    start: { lat: 28.6139, lng: 77.209, label: "New Delhi (India)", labelPosition: "top" },
                    end: { lat: 55.6761, lng: 12.5683, label: "Copenhagen (Denmark)", labelPosition: "right" }
                  }
                ]}
              />
            </Suspense>
          </div>
        </div>
      </section>
    </Layout>
  );
}
