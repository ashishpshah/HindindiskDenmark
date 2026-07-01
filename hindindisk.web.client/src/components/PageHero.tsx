import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function PageHero({ eyebrow, title, subtitle, image, children }: { eyebrow?: string; title: string; subtitle?: string; image: string; children?: ReactNode }) {
  return (
    <section className="relative h-[60vh] min-h-[420px] overflow-hidden">
      <img src={image} alt={title} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/80" />
      <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col justify-end px-6 pb-16 pt-32 text-white">
        {eyebrow && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">{eyebrow}</motion.div>}
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mt-3 font-display text-5xl font-bold sm:text-6xl md:text-7xl text-white">{title}</motion.h1>
        {subtitle && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-4 max-w-2xl text-lg text-white/80">{subtitle}</motion.p>}
        {children}
      </div>
    </section>
  );
}
