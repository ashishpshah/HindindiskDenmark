import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Hero } from "@/components/home/Hero";
import { Branches } from "@/components/home/Branches";
import { About, FeaturedMenu, WhyChooseUs, CTA } from "@/components/home/Sections";
import { GalleryStrip, FAQ } from "@/components/home/GalleryFAQ";
import { Testimonials } from "@/components/home/Reviews";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hind Indisk Restaurant — Authentic Indian Cuisine In Denmark" },
      { name: "description", content: "Award-winning Indian restaurant in Aarhus and Copenhagen. Order online, reserve your table, and discover authentic Indian flavours." },
      { property: "og:title", content: "Hind Indisk Restaurant — Authentic Indian Cuisine In Denmark" },
      { property: "og:description", content: "Order online, reserve your table, and discover Denmark's most loved Indian restaurant." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <Layout>
      <Hero />
      <Branches />
      <About />
      <FeaturedMenu />
      <WhyChooseUs />
      <Testimonials />
      <GalleryStrip />
      <FAQ />
      <CTA />
    </Layout>
  );
}
