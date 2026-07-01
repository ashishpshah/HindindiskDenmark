import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { galleryImages, faqs } from "@/data/mock";
import { SectionHeading } from "./Branches";
import { useI18n } from "@/i18n/I18nProvider";

export function GalleryStrip() {
  const { t } = useI18n();
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow={t("home.gallery.eyebrow")}
          title={t("home.gallery.title")}
          subtitle={t("home.gallery.subtitle")}
        />
        <div className="mt-14 columns-2 gap-4 sm:columns-3 lg:columns-4 [&>*]:mb-4">
          {galleryImages.map((src, i) => (
            <motion.div
              key={src}
              initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
              transition={{ delay: (i % 6) * 0.05 }}
              className="group relative overflow-hidden rounded-2xl shadow-soft break-inside-avoid"
            >
              <img src={src} alt="Gallery" className="w-full transition duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition group-hover:opacity-100" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FAQ() {
  const { t, lang } = useI18n();
  return (
    <section className="bg-surface py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16 items-center">
          {/* Left Column: Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-elegant">
              <img
                src="https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80"
                alt="Authentic Indian Dining"
                className="h-full w-full object-cover transition duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            </div>
            {/* Floating badge */}
            <div className="absolute -right-4 bottom-8 hidden rounded-2xl glass px-5 py-4 shadow-soft sm:flex sm:items-center sm:gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full gradient-primary text-primary-foreground animate-pulse">
                <span className="font-display font-bold text-lg">100%</span>
              </div>
              <div>
                <div className="text-xs uppercase text-muted-foreground">{t("home.faq.authentic")}</div>
                <div className="font-display text-sm font-semibold">{t("home.faq.indianSpices")}</div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: FAQ Accordion */}
          <div className="lg:col-span-7">
            <SectionHeading
              center={false}
              eyebrow={t("home.faq.eyebrow")}
              title={t("home.faq.title")}
              subtitle={t("home.faq.subtitle")}
            />
            <Accordion type="single" collapsible className="mt-10 space-y-3">
              {faqs.map((f, i) => (
                <AccordionItem key={i} value={`f-${i}`} className="overflow-hidden rounded-2xl border bg-card px-5 shadow-soft">
                  <AccordionTrigger className="py-5 text-left font-display text-lg hover:no-underline">
                    {lang === "da" ? f.qDa : f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {lang === "da" ? f.aDa : f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}
