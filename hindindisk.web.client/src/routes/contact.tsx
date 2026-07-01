import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, lazy, Suspense } from "react";
import {
  Phone, MapPin,
  Loader2, Star, ArrowRight, CheckCircle2, AlertTriangle,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useBranches } from "@/hooks/useBranches";
import { useCart } from "@/context/CartContext";
import { apiFetch } from "@/lib/api/client";
import { useI18n } from "@/i18n/I18nProvider";

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

// ── Contact form state ─────────────────────────────────────────────────────────

const EMPTY_CONTACT = { name: "", email: "", subject: "", message: "" };

// ── Page ──────────────────────────────────────────────────────────────────────

function ContactPage() {
  const { t } = useI18n();
  const { setBranch } = useCart();
  const { data: branchesData = [] } = useBranches();

  const [contactForm,   setContactForm]   = useState(EMPTY_CONTACT);
  const [sending,       setSending]       = useState(false);
  const [contactResult, setContactResult] = useState<{ success: boolean; message: string } | null>(null);

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
                <Button asChild className="gradient-primary text-primary-foreground cursor-pointer">
                  <Link to="/reservation" onClick={() => setBranch(b.name)}>
                    {t("pages.locations.bookBtn")} <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
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
