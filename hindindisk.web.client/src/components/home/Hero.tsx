import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHeroSlides, type CtaDto } from "@/hooks/useHeroSlides";
import { heroSlides as fallbackSlides } from "@/data/mock";
import { useI18n } from "@/i18n/I18nProvider";
import { BASE } from "@/lib/api/client";

function resolveUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${BASE}${url}`;
}

type NormalizedSlide = {
  title: string;
  titleDa: string;
  subtitle: string;
  subtitleDa: string;
  tagline: string;
  taglineDa: string;
  imageUrl: string;
  ctas: CtaDto[];
};

export function Hero() {
  const { t, lang } = useI18n();
  const { data: apiSlides = [] } = useHeroSlides();
  const usingApi = apiSlides.length > 0;

  const slides: NormalizedSlide[] = usingApi
    ? apiSlides
    : fallbackSlides.map(s => ({ ...s, imageUrl: (s as any).image ?? "", tagline: "", taglineDa: "", ctas: [] }));

  const [i, setI] = useState(0);

  useEffect(() => {
    if (slides.length === 0) return;
    const intervalId = setInterval(() => setI((p) => (p + 1) % slides.length), 6000);
    return () => clearInterval(intervalId);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const slide = slides[i];
  const slideTitle    = lang === "da" ? slide.titleDa    : slide.title;
  const slideSubtitle = lang === "da" ? slide.subtitleDa : slide.subtitle;
  const slideTagline  = (lang === "da" ? slide.taglineDa : slide.tagline) || t("home.hero.tagline");

  const renderCtaButton = (cta: CtaDto, idx: number) => {
    const isPrimary = idx === 0;
    const link  = cta.link || "/";
    const label = lang === "da" ? cta.textDa || cta.text : cta.text;
    const isExternal = link.startsWith("http://") || link.startsWith("https://");

    const primaryClass = "gradient-primary text-primary-foreground shadow-elegant hover:opacity-95";
    const secondaryClass = "border-white/30 bg-white/5 text-white backdrop-blur hover:bg-white/15 hover:text-white";

    if (isExternal) {
      return (
        <Button key={idx} asChild size="lg" className={isPrimary ? primaryClass : secondaryClass} variant={isPrimary ? "default" : "outline"}>
          <a href={link} target="_blank" rel="noopener noreferrer">
            {label} {isPrimary && <ArrowRight className="ml-1 h-4 w-4" />}
          </a>
        </Button>
      );
    }

    return isPrimary ? (
      <Button key={idx} asChild size="lg" className={primaryClass}>
        <Link to={link as any}>{label} <ArrowRight className="ml-1 h-4 w-4" /></Link>
      </Button>
    ) : (
      <Button key={idx} asChild size="lg" variant="outline" className={secondaryClass}>
        <Link to={link as any}>{label}</Link>
      </Button>
    );
  };

  return (
    <section className="relative mt-24 h-[100svh] min-h-[640px] overflow-hidden">
      <AnimatePresence>
        <motion.div
          key={i}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        >
          <img src={resolveUrl(slide.imageUrl)} alt={slideTitle} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-black/85" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 mx-auto flex h-full max-w-7xl items-end px-6 pb-16 pt-12 sm:items-center">
        <div className="max-w-2xl text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs uppercase tracking-[0.2em] backdrop-blur-md"
          >
            <Star className="h-3.5 w-3.5 fill-primary text-primary" /> {slideTagline}
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.h1
              key={slideTitle}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="mt-6 font-display text-5xl font-bold leading-[1.05] text-[#E8E2D9] sm:text-6xl md:text-7xl text-white"
            >
              {slideTitle}
            </motion.h1>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.p
              key={slideSubtitle}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-6 max-w-xl text-lg text-white/80"
            >
              {slideSubtitle}
            </motion.p>
          </AnimatePresence>

          {slide.ctas.length > 0 ? (
            <div className="mt-10 flex flex-wrap gap-3">
              {slide.ctas.map((cta, idx) => renderCtaButton(cta, idx))}
            </div>
          ) : !usingApi ? (
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" className="gradient-primary text-primary-foreground shadow-elegant hover:opacity-95">
                <Link to="/menu">{t("home.hero.orderNow")} <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/5 text-white backdrop-blur hover:bg-white/15 hover:text-white">
                <Link to="/reservation"><CalendarDays className="mr-2 h-4 w-4" /> {t("home.hero.bookTable")}</Link>
              </Button>
            </div>
          ) : null}

          <div className="mt-10 flex gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setI(idx)}
                className={`h-1.5 rounded-full transition-all ${idx === i ? "w-10 bg-primary" : "w-4 bg-white/40"}`}
                aria-label={`${t("home.hero.slideLabel")} ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
