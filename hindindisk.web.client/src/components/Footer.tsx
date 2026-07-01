import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Twitter, Phone, Mail, MapPin } from "lucide-react";
import { logoUrl, navLinks } from "@/data/mock";
import { useBranches } from "@/hooks/useBranches";
import { useI18n } from "@/i18n/I18nProvider";
import { nowInDenmark } from "@/lib/denmarkTime";

const NAV_KEY_MAP: Record<string, string> = {
  "/":            "nav.home",
  "/about":       "nav.about",
  "/menu":        "nav.menu",
  "/reservation": "nav.reservation",
  "/gallery":     "nav.gallery",
  "/contact":     "nav.contact",
};

export function Footer() {
  const { t } = useI18n();
  const { data: branchesData = [] } = useBranches();
  return (
    <footer className="relative mt-32 overflow-hidden bg-secondary text-secondary-foreground">
      <div className="absolute inset-0 opacity-30" style={{ background: "var(--gradient-dark)" }} />
      <div className="absolute -top-40 left-1/2 h-80 w-[80%] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2 space-y-5">
          <img src={logoUrl} alt="Hind Indisk" className="h-20" />
          <p className="max-w-sm text-base font-sans text-white/70 leading-relaxed">
            {t("footer.tagline")}
          </p>
          <div className="flex gap-3">
            {[
              { Icon: Facebook,  href: "https://www.facebook.com/Hind-Indisk-Restaurant-106301930914419" },
              { Icon: Instagram, href: "https://www.instagram.com/hindindisk/" },
              { Icon: Twitter,   href: "https://x.com/HindIndisk" },
            ].map(({ Icon, href }) => (
              <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                className="grid h-10 w-10 place-items-center rounded-full border border-white/15 hover:border-primary hover:text-primary transition">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-4 font-display text-xl text-primary">{t("footer.quickLinks")}</h4>
          <ul className="space-y-2 text-base font-sans text-white/70">
            {navLinks.map((l) => (
              <li key={l.to}><Link to={l.to} className="font-sans hover:text-primary">{t(NAV_KEY_MAP[l.to] ?? l.label)}</Link></li>
            ))}
          </ul>
        </div>

        {branchesData.map((b) => (
          <div key={b.id}>
            <h4 className="mb-4 font-display text-xl text-primary">{b.name}</h4>
            <div className="space-y-2.5 text-base font-sans text-white/70">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary/70" />
                <div>
                  <div>{b.address}</div>
                  {b.addressLine2 && <div>{b.addressLine2}</div>}
                  <div>{b.city}, {b.postalCode}</div>
                </div>
              </div>
              {b.phone && (
                <a href={`tel:${b.phone}`} className="flex items-center gap-2 hover:text-primary transition">
                  <Phone className="h-4 w-4 shrink-0 text-primary/70" />
                  {b.phone}
                </a>
              )}
              {b.email && (
                <a href={`mailto:${b.email}`} className="flex items-center gap-2 hover:text-primary transition">
                  <Mail className="h-4 w-4 shrink-0 text-primary/70" />
                  {b.email}
                </a>
              )}
              {b.googleMapsLink && (
                <a href={b.googleMapsLink} target="_blank" rel="noopener noreferrer"
                  className="inline-block text-sm text-primary/80 hover:text-primary underline underline-offset-2 transition">
                  {t("footer.getDirections")} →
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="relative border-t border-white/10 px-6 py-6 text-center text-sm text-white/50">
        © {nowInDenmark().getFullYear()} {t("footer.copyright")}
      </div>
    </footer>
  );
}
