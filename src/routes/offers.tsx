import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BadgePercent, Copy, Sparkles } from "lucide-react";
import { Layout } from "@/components/Layout";
import { PageHero } from "@/components/PageHero";
import { offers } from "@/data/mock";
import { toast } from "sonner";

export const Route = createFileRoute("/offers")({
  head: () => ({
    meta: [
      { title: "Offers — Hind Indisk Restaurant" },
      { name: "description", content: "Save on family dinners, lunch specials and online orders with our latest offers." },
      { property: "og:title", content: "Special Offers" },
      { property: "og:description", content: "Limited-time savings on your favourite Indian dishes." },
    ],
  }),
  component: OffersPage,
});

function OffersPage() {
  return (
    <Layout>
      <PageHero eyebrow="Offers" title="Eat More, Save More" subtitle="Seasonal promotions, family deals and online-only savings."
        image="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1920&q=80" />
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...offers, ...offers].map((o, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 3) * 0.08 }}
              className="group relative overflow-hidden rounded-3xl p-8 text-primary-foreground shadow-elegant"
              style={{ background: i % 2 ? "var(--gradient-warm)" : "var(--gradient-primary)" }}
            >
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
              <Sparkles className="h-6 w-6" />
              <BadgePercent className="h-10 w-10 mt-2" />
              <h3 className="mt-4 font-display text-2xl font-semibold">{o.title}</h3>
              <p className="mt-2 text-white/85">{o.desc}</p>
              <div className="mt-6 flex items-center justify-between rounded-2xl border border-dashed border-white/40 bg-black/15 px-4 py-3 backdrop-blur">
                <span className="font-mono tracking-widest">{o.code}</span>
                <button onClick={() => { navigator.clipboard?.writeText(o.code); toast.success(`Copied ${o.code}`); }} className="inline-flex items-center gap-1 text-xs font-semibold hover:underline">
                  <Copy className="h-3.5 w-3.5" /> Copy
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </Layout>
  );
}
