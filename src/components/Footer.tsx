import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Twitter, Phone, Mail, MapPin, Send } from "lucide-react";
import { logoUrl, navLinks } from "@/data/mock";
import { useBranches } from "@/hooks/useBranches";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Footer() {
  const { data: branchesData = [] } = useBranches();
  return (
    <footer className="relative mt-32 overflow-hidden bg-secondary text-secondary-foreground">
      <div className="absolute inset-0 opacity-30" style={{ background: "var(--gradient-dark)" }} />
      <div className="absolute -top-40 left-1/2 h-80 w-[80%] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2 space-y-5">
          <img src={logoUrl} alt="Hind Indisk" className="h-14" />
          <p className="max-w-sm text-sm font-sans text-white/70 leading-relaxed">
            Authentic Indian cuisine crafted with passion, served in the heart of Denmark.
            Two warm dining rooms, one timeless recipe book.
          </p>
          <div className="flex gap-3">
            {[Facebook, Instagram, Twitter].map((Icon, i) => (
              <a key={i} href="#" className="grid h-10 w-10 place-items-center rounded-full border border-white/15 hover:border-primary hover:text-primary transition">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-4 font-display text-lg text-primary">Quick Links</h4>
          <ul className="space-y-2 text-sm font-sans text-white/70">
            {navLinks.map((l) => (
              <li key={l.to}><Link to={l.to} className="font-sans hover:text-primary">{l.label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 font-display text-lg text-primary">Branches</h4>
          <ul className="space-y-4 text-sm font-sans text-white/70">
            {branchesData.map((b) => (
              <li key={b.name}>
                <div className="font-medium font-sans text-white">{b.city}</div>
                <div className="flex items-start gap-1.5 mt-1 font-sans"><MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />{b.address}</div>
                <div className="flex items-center gap-1.5 mt-1 font-sans"><Phone className="h-3.5 w-3.5" />{b.phone}</div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 font-display text-lg text-primary">Newsletter</h4>
          <p className="mb-3 text-sm font-sans text-white/70">Get seasonal menus and updates.</p>
          <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
            <Input placeholder="your@email.dk" className="font-sans border-white/15 bg-white/5 text-white placeholder:text-white/40" />
            <Button size="icon" className="gradient-primary text-primary-foreground"><Send className="h-4 w-4" /></Button>
          </form>
          <div className="mt-6 space-y-2 text-sm font-sans text-white/70">
            <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> hello@hindindisk.dk</div>
            <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> +45 86 12 34 56</div>
          </div>
        </div>
      </div>
      <div className="relative border-t border-white/10 px-6 py-6 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Hind Indisk Restaurant · Crafted with care in Denmark
      </div>
    </footer>
  );
}
