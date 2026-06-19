import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { heroSlides } from "@/data/mock";

export function Hero() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % heroSlides.length), 6000);
    return () => clearInterval(t);
  }, []);
  const slide = heroSlides[i];

  return (
    <section className="relative h-[100svh] min-h-[640px] overflow-hidden">
      <AnimatePresence>
        <motion.div
          key={i}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        >
          <img src={slide.image} alt={slide.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-black/85" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 mx-auto flex h-full max-w-7xl items-end px-6 pb-24 pt-32 sm:items-center">
        <div className="max-w-2xl text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs uppercase tracking-[0.2em] backdrop-blur-md"
          >
            <Star className="h-3.5 w-3.5 fill-primary text-primary" /> Denmark's #1 Indian Restaurant
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.h1
              key={slide.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="mt-6 font-display text-5xl font-bold leading-[1.05] sm:text-6xl md:text-7xl"
            >
              {slide.title}
            </motion.h1>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.p
              key={slide.subtitle}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-6 max-w-xl text-lg text-white/80"
            >
              {slide.subtitle}
            </motion.p>
          </AnimatePresence>

          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg" className="gradient-primary text-primary-foreground shadow-elegant hover:opacity-95">
              <Link to="/menu">Order Now <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/5 text-white backdrop-blur hover:bg-white/15 hover:text-white">
              <Link to="/reservation"><CalendarDays className="mr-2 h-4 w-4" /> Book a Table</Link>
            </Button>
          </div>

          <div className="mt-10 flex gap-2">
            {heroSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setI(idx)}
                className={`h-1.5 rounded-full transition-all ${idx === i ? "w-10 bg-primary" : "w-4 bg-white/40"}`}
                aria-label={`slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      <motion.div
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute bottom-24 right-8 hidden h-28 w-28 rounded-3xl shadow-glow md:block"
        style={{ background: "var(--gradient-primary)" }}
      >
        <div className="grid h-full place-items-center text-center text-primary-foreground">
          <div>
            <div className="font-display text-3xl font-bold">4.9</div>
            <div className="text-[10px] uppercase tracking-widest">5500+ reviews</div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
