import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { PageHero } from "@/components/PageHero";
import { Lightbox } from "@/components/Lightbox";
import { MasonryGallery } from "@/components/MasonryGallery";
import { galleryImages as fallbackImages } from "@/data/mock";
import { useI18n } from "@/i18n/I18nProvider";
import { useGalleryImages } from "@/hooks/useGalleryImages";
import { resolveUrl } from "@/lib/api/client";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — Hind Indisk Restaurant" },
      { name: "description", content: "A visual taste of our dishes, dining rooms and moments at Hind Indisk." },
      { property: "og:title", content: "Gallery" },
      { property: "og:description", content: "Photos from our kitchens and dining rooms." },
    ],
  }),
  component: GalleryPage,
});

function GalleryPage() {
  const { t, lang } = useI18n();
  const { data: apiImages = [] } = useGalleryImages();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const images: { url: string; caption: string }[] = apiImages.length > 0
    ? apiImages.map(img => ({
        url: resolveUrl(img.url),
        caption: lang === "da" ? img.captionDa || img.caption : img.caption,
      }))
    : fallbackImages.map(url => ({ url, caption: "" }));

  return (
    <Layout>
      <PageHero
        eyebrow={t("pages.gallery.throughLens")}
        title={t("pages.gallery.throughLens")}
        subtitle={t("pages.gallery.dishesDetails")}
        image="https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=1920&q=80"
      />
      <section className="mx-auto max-w-7xl px-6 py-20">
        <MasonryGallery
          images={images.map(img => ({ url: img.url, title: img.caption }))}
          onImageClick={setOpenIndex}
        />
      </section>

      <Lightbox
        images={images}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onNavigate={setOpenIndex}
      />
    </Layout>
  );
}
