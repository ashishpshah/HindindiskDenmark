import { motion } from "framer-motion";
import { MapPin, Star } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useBranches } from "@/hooks/useBranches";

// Editorial fields not stored in the DB
const BRANCH_DISPLAY: Record<string, { image: string; rating: number; reviews: number }> = {
  "Hind Indisk Aarhus": {
    image:   "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80",
    rating:  4.8,
    reviews: 2400,
  },
  "Hind Indisk Copenhagen": {
    image:   "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
    rating:  4.9,
    reviews: 3100,
  },
};

export function Branches() {
  const { data: branchesData = [] } = useBranches();
  return (
    <section className="bg-surface py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading eyebrow="Two Homes" title="Visit Our Branches" subtitle="Two warm dining rooms across Denmark, each with its own character." />
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {branchesData.map((b, i) => {
            const display = BRANCH_DISPLAY[b.name] ?? { image: "", rating: 4.8, reviews: 0 };
            return (
              <motion.div
                key={b.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6 }}
                className="group relative overflow-hidden rounded-3xl bg-card shadow-soft transition hover:shadow-elegant"
              >
                <div className="relative h-72 overflow-hidden">
                  <img src={display.image} alt={b.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute left-5 top-5 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium">
                    <Star className="h-3.5 w-3.5 fill-primary text-primary" /> {display.rating} · {display.reviews.toLocaleString()} reviews
                  </div>
                  <div className="absolute inset-x-5 bottom-5 text-white">
                    <h3 className="font-display text-2xl font-semibold">{b.name}</h3>
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-white/80"><MapPin className="h-4 w-4" /> {b.city}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-6">
                  <div className="text-sm text-muted-foreground">{b.weekdayHours}</div>
                  <Link to="/locations" className="text-sm font-semibold text-primary hover:text-primary-dark">View →</Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function SectionHeading({ eyebrow, title, subtitle, center = true }: { eyebrow?: string; title: string; subtitle?: string; center?: boolean }) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && (
        <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">{eyebrow}</motion.div>
      )}
      <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">{title}</motion.h2>
      {subtitle && (
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="mt-4 text-muted-foreground">{subtitle}</motion.p>
      )}
    </div>
  );
}
