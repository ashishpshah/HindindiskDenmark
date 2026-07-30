import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Lightbox } from "@/components/Lightbox";
import { MasonryGallery } from "@/components/MasonryGallery";
import { galleryImages, faqs } from "@/data/mock";
import { SectionHeading } from "./Branches";
import { useI18n } from "@/i18n/I18nProvider";
import { useGalleryImages } from "@/hooks/useGalleryImages";
import { resolveUrl } from "@/lib/api/client";

export function GalleryStrip() {
  const { t } = useI18n();
  const { data: apiImages = [] } = useGalleryImages();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const images = useMemo(() => {
    const pool = apiImages.length > 0
      ? apiImages.map(img => resolveUrl(img.url))
      : galleryImages;
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 12);
  }, [apiImages]);

  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow={t("home.gallery.eyebrow")}
          title={t("home.gallery.title")}
          subtitle={t("home.gallery.subtitle")}
        />
        <div className="mt-14">
          <MasonryGallery images={images.map(url => ({ url }))} onImageClick={setOpenIndex} />
        </div>
        <div className="mt-10 flex justify-center">
          <Link
            to="/gallery"
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 px-6 py-2.5 text-sm font-medium text-primary transition hover:bg-primary hover:text-primary-foreground"
            data-tagid="gallery-faq-view-more"
          >
            {t("home.gallery.viewMore")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
      <Lightbox
        images={images.map(url => ({ url }))}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onNavigate={setOpenIndex}
      />
    </section>
  );
}

// export function FAQ() {
//   const { t, lang } = useI18n();
//   return (
//     <section className="bg-surface py-24">
//       <div className="mx-auto max-w-7xl px-6">
//         <div className="grid gap-12 lg:grid-cols-12 lg:gap-16 items-center">
//           {/* Left Column: Image */}
//           <motion.div
//             initial={{ opacity: 0, x: -30 }}
//             whileInView={{ opacity: 1, x: 0 }}
//             viewport={{ once: true }}
//             transition={{ duration: 0.6 }}
//             className="lg:col-span-5 relative"
//           >
//             <div className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-elegant">
//               <img
//                 src="https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80"
//                 alt="Authentic Indian Dining"
//                 className="h-full w-full object-cover transition duration-700 hover:scale-105"
//               />
//               <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
//             </div>
//             {/* Floating badge */}
//             <div className="absolute -right-4 bottom-8 hidden rounded-2xl glass px-5 py-4 shadow-soft sm:flex sm:items-center sm:gap-3">
//               <div className="grid h-12 w-12 place-items-center rounded-full gradient-primary text-primary-foreground animate-pulse">
//                 <span className="font-display font-bold text-lg">100%</span>
//               </div>
//               <div>
//                 <div className="text-xs uppercase text-muted-foreground">{t("home.faq.authentic")}</div>
//                 <div className="font-display text-sm font-semibold">{t("home.faq.indianSpices")}</div>
//               </div>
//             </div>
//           </motion.div>

//           {/* Right Column: FAQ Accordion */}
//           <div className="lg:col-span-7">
//             <SectionHeading
//               center={false}
//               eyebrow={t("home.faq.eyebrow")}
//               title={t("home.faq.title")}
//               subtitle={t("home.faq.subtitle")}
//             />
//             <Accordion type="single" collapsible className="mt-10 space-y-3">
//               {faqs.map((f, i) => (
//                 <AccordionItem key={i} value={`f-${i}`} className="overflow-hidden rounded-2xl border bg-card px-5 shadow-soft">
//                   <AccordionTrigger className="py-5 text-left font-display text-lg hover:no-underline" data-tagid={`gallery-faq-trigger-${i}`}>
//                     {lang === "da" ? f.qDa : f.q}
//                   </AccordionTrigger>
//                   <AccordionContent className="text-muted-foreground">
//                     {lang === "da" ? f.aDa : f.a}
//                   </AccordionContent>
//                 </AccordionItem>
//               ))}
//             </Accordion>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }
