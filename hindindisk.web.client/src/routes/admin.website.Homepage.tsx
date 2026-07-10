import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, GripVertical, Pencil, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminHeroSlides, useCreateHeroSlide, useUpdateHeroSlide, useDeleteHeroSlide,
  useReorderHeroSlide,
  type HeroSlideDto, type CreateHeroSlideInput, type CtaDto,
} from "@/hooks/useHeroSlides";
import {
  useAdminWhyChooseUs, useCreateWhyChooseUs, useUpdateWhyChooseUs, useDeleteWhyChooseUs,
  type WhyChooseUsItemDto, type SaveWhyChooseUsItemInput,
} from "@/hooks/useWhyChooseUs";
import {
  useAdminHomeStorySection, useUpdateHomeStorySection,
  type HomeStorySectionDto,
} from "@/hooks/useHomeStorySection";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { BASE } from "@/lib/api/client";

export const Route = createFileRoute("/admin/website/Homepage")({ component: HomepageSettings });

type Tab = "hero" | "ourStory" | "whyChooseUs";

function resolveUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${BASE}${url}`;
}

const WHY_ICONS = ["ChefHat", "Leaf", "Bike", "HeartHandshake", "Star", "Shield", "Heart", "Award", "Clock", "Utensils"];

// ─────────────────────────────────────────────────────────────────────────────

function HomepageSettings() {
  const [tab, setTab] = useState<Tab>("hero");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Homepage</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage homepage sections</p>
      </div>

      <div className="flex gap-1 border-b">
        {([
          { key: "hero" as Tab,        label: "Hero Banners" },
          { key: "ourStory" as Tab,    label: "Our Story" },
          { key: "whyChooseUs" as Tab, label: "Why Choose Us" },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "hero"        && <HeroTab />}
      {tab === "ourStory"    && <OurStoryTab />}
      {tab === "whyChooseUs" && <WhyChooseUsTab />}
    </div>
  );
}

// ── Hero Banners Tab ──────────────────────────────────────────────────────────

const EMPTY_SLIDE: CreateHeroSlideInput = {
  title: "", titleDa: "", subtitle: "", subtitleDa: "",
  tagline: "", taglineDa: "",
  imageUrl: "", isActive: true, sortOrder: 0, ctas: [],
};

function HeroTab() {
  const qc = useQueryClient();
  const { data: slides = [], isLoading } = useAdminHeroSlides();

  const [showModal, setShowModal] = useState(false);
  const [editId,    setEditId]    = useState<number | null>(null);
  const [form,      setForm]      = useState<CreateHeroSlideInput>(EMPTY_SLIDE);

  const createSlide  = useCreateHeroSlide();
  const updateSlide  = useUpdateHeroSlide(editId ?? 0);
  const deleteSlide  = useDeleteHeroSlide();
  const reorderSlide = useReorderHeroSlide();
  const isSaving     = createSlide.isPending || updateSlide.isPending;

  const openCreate = () => { setEditId(null); setForm({ ...EMPTY_SLIDE, sortOrder: slides.length }); setShowModal(true); };
  const openEdit   = (s: HeroSlideDto) => {
    setEditId(s.id);
    setForm({ title: s.title, titleDa: s.titleDa, subtitle: s.subtitle, subtitleDa: s.subtitleDa, tagline: s.tagline, taglineDa: s.taglineDa, imageUrl: s.imageUrl, isActive: s.isActive, sortOrder: s.sortOrder, ctas: [...s.ctas] });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required."); return; }
    try {
      if (editId !== null) {
        await updateSlide.mutateAsync({ title: form.title, titleDa: form.titleDa, subtitle: form.subtitle, subtitleDa: form.subtitleDa, tagline: form.tagline, taglineDa: form.taglineDa, imageUrl: form.imageUrl, isActive: form.isActive, sortOrder: form.sortOrder, ctas: form.ctas });
        toast.success("Slide updated");
      } else {
        await createSlide.mutateAsync(form);
        toast.success("Slide created");
      }
      setShowModal(false);
    } catch { toast.error("Failed to save slide"); }
  };

  const addCta    = () => setForm(p => ({ ...p, ctas: [...p.ctas, { text: "", textDa: "", link: "" }] }));
  const updateCta = (idx: number, patch: Partial<CtaDto>) => setForm(p => ({ ...p, ctas: p.ctas.map((c, i) => i === idx ? { ...c, ...patch } : c) }));
  const removeCta = (idx: number) => setForm(p => ({ ...p, ctas: p.ctas.filter((_, i) => i !== idx) }));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" className="gradient-primary text-primary-foreground h-9" onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" /> Add Slide
        </Button>
      </div>

      {isLoading ? (
        <Loader text="Loading slides…" />
      ) : slides.length === 0 ? (
        <Empty label='No hero slides yet. Click "Add Slide" to create one.' />
      ) : (
        <div className="space-y-3">
          {slides.map(s => (
            <SlideRow
              key={s.id} slide={s}
              onEdit={() => openEdit(s)}
              onDelete={() => deleteSlide.mutate(s.id, {
                onSuccess: () => { toast.success("Slide deleted"); qc.invalidateQueries({ queryKey: ["admin-hero-slides"] }); },
                onError:   () => toast.error("Failed to delete"),
              })}
              onReorder={dir => reorderSlide.mutate({ id: s.id, sortOrder: dir === "up" ? s.sortOrder - 1 : s.sortOrder + 1 }, { onError: () => toast.error("Failed to reorder") })}
            />
          ))}
        </div>
      )}

      {showModal && (
        <Modal title={editId !== null ? "Edit Slide" : "New Slide"} wide onClose={() => setShowModal(false)}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Title (EN)"><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></Field>
            <Field label="Title (DA)"><Input value={form.titleDa} onChange={e => setForm(p => ({ ...p, titleDa: e.target.value }))} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Subtitle (EN)"><Input value={form.subtitle} onChange={e => setForm(p => ({ ...p, subtitle: e.target.value }))} /></Field>
            <Field label="Subtitle (DA)"><Input value={form.subtitleDa} onChange={e => setForm(p => ({ ...p, subtitleDa: e.target.value }))} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tagline (EN)"><Input value={form.tagline} onChange={e => setForm(p => ({ ...p, tagline: e.target.value }))} placeholder="Denmark's #1 Indian Restaurant" /></Field>
            <Field label="Tagline (DA)"><Input value={form.taglineDa} onChange={e => setForm(p => ({ ...p, taglineDa: e.target.value }))} placeholder="Danmarks #1 indiske restaurant" /></Field>
          </div>
          <Field label="Hero Image">
            <ImagePicker value={form.imageUrl} onChange={url => setForm(p => ({ ...p, imageUrl: url }))} uploadUrl="/api/admin/upload/hero-slides" />
          </Field>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <Switch checked={form.isActive} onCheckedChange={v => setForm(p => ({ ...p, isActive: v }))} />
              <span className="text-sm font-medium">{form.isActive ? "Active" : "Inactive"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm">Sort Order</Label>
              <Input type="number" min={0} value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: Number(e.target.value) }))} className="h-8 w-20 text-sm" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Call-to-Action Buttons</Label>
              <Button size="sm" variant="outline" onClick={addCta} className="h-7 text-xs"><Plus className="mr-1 h-3 w-3" /> Add CTA</Button>
            </div>
            {form.ctas.length === 0 && <p className="text-xs text-muted-foreground">No CTAs — the slide will display default buttons</p>}
            {form.ctas.map((cta, idx) => (
              <div key={idx} className="rounded-lg border bg-gray-50 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">CTA #{idx + 1}</span>
                  <button onClick={() => removeCta(idx)} className="text-red-500 hover:text-red-700"><X className="h-3.5 w-3.5" /></button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input placeholder="Text (EN)" value={cta.text} onChange={e => updateCta(idx, { text: e.target.value })} className="h-8 text-sm" />
                  <Input placeholder="Text (DA)" value={cta.textDa} onChange={e => updateCta(idx, { textDa: e.target.value })} className="h-8 text-sm" />
                  <Input placeholder="Link (e.g. /menu)" value={cta.link} onChange={e => updateCta(idx, { link: e.target.value })} className="h-8 text-sm" />
                </div>
              </div>
            ))}
          </div>
          <ModalFooter onClose={() => setShowModal(false)} onSave={handleSave} isSaving={isSaving} isEdit={editId !== null} />
        </Modal>
      )}
    </div>
  );
}

// ── Our Story Tab ─────────────────────────────────────────────────────────────

function OurStoryTab() {
  const { data: settings, isLoading } = useAdminHomeStorySection();
  const update = useUpdateHomeStorySection();

  type Field = keyof HomeStorySectionDto;
  const [draft, setDraft] = useState<Partial<HomeStorySectionDto>>({});

  const val = (key: Field) => (draft[key] !== undefined ? draft[key] : settings?.[key]) ?? "";
  const set = (key: Field) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDraft(p => ({ ...p, [key]: e.target.value }));

  const handleSave = async () => {
    if (!settings) return;
    try {
      const payload: Partial<HomeStorySectionDto> = {
        eyebrow:               val("eyebrow"),
        eyebrowDa:             val("eyebrowDa"),
        title:                 val("title"),
        titleDa:               val("titleDa"),
        subtitle:              val("subtitle"),
        subtitleDa:            val("subtitleDa"),
        heritageBadgeLabel:    val("heritageBadgeLabel"),
        heritageBadgeLabelDa:  val("heritageBadgeLabelDa"),
        heritageBadgeSince:    val("heritageBadgeSince"),
        heritageBadgeSinceDa:  val("heritageBadgeSinceDa"),
        buttonText:            val("buttonText"),
        buttonTextDa:          val("buttonTextDa"),
        buttonLink:            val("buttonLink"),
        mainImage:             val("mainImage"),
        overlayImage:          val("overlayImage"),
      };
      await update.mutateAsync(payload);
      toast.success("Our Story section saved");
      setDraft({});
    } catch { toast.error("Failed to save"); }
  };

  if (isLoading) return <Loader text="Loading…" />;

  return (
    <div className="space-y-8 max-w-3xl">

      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Section Text</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Eyebrow (EN)"><Input value={val("eyebrow")}   onChange={set("eyebrow")}   placeholder="Our Story" /></Field>
          <Field label="Eyebrow (DA)"><Input value={val("eyebrowDa")} onChange={set("eyebrowDa")} placeholder="Vores historie" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Title (EN)"><Input value={val("title")}   onChange={set("title")}   placeholder="A Family Kitchen, Rooted In Denmark" /></Field>
          <Field label="Title (DA)"><Input value={val("titleDa")} onChange={set("titleDa")} placeholder="Et familiekøkken, forankret i Danmark" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Subtitle / Description (EN)">
            <Textarea rows={3} value={val("subtitle")}   onChange={set("subtitle")}   placeholder="Two decades of crafting…" />
          </Field>
          <Field label="Subtitle / Description (DA)">
            <Textarea rows={3} value={val("subtitleDa")} onChange={set("subtitleDa")} placeholder="To årtier med autentisk…" />
          </Field>
        </div>
      </div>

      <div className="space-y-4 border-t pt-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Heritage Badge</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Badge Label (EN)"><Input value={val("heritageBadgeLabel")}   onChange={set("heritageBadgeLabel")}   placeholder="Heritage" /></Field>
          <Field label="Badge Label (DA)"><Input value={val("heritageBadgeLabelDa")} onChange={set("heritageBadgeLabelDa")} placeholder="Arv" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Badge Since (EN)"><Input value={val("heritageBadgeSince")}   onChange={set("heritageBadgeSince")}   placeholder="Since 2004" /></Field>
          <Field label="Badge Since (DA)"><Input value={val("heritageBadgeSinceDa")} onChange={set("heritageBadgeSinceDa")} placeholder="Siden 2004" /></Field>
        </div>
      </div>

      <div className="space-y-4 border-t pt-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Button</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Button Text (EN)"><Input value={val("buttonText")}   onChange={set("buttonText")}   placeholder="Discover Our Story" /></Field>
          <Field label="Button Text (DA)"><Input value={val("buttonTextDa")} onChange={set("buttonTextDa")} placeholder="Opdage vores historie" /></Field>
        </div>
        <Field label="Button Link"><Input value={val("buttonLink")} onChange={set("buttonLink")} placeholder="/about" /></Field>
      </div>

      <div className="space-y-4 border-t pt-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Images</h3>
        <div className="grid grid-cols-2 gap-6">
          <Field label="Main Image (chef / restaurant)">
            <ImagePicker
              value={val("mainImage")}
              onChange={url => setDraft(p => ({ ...p, mainImage: url }))}
              uploadUrl="/api/admin/upload/about"
            />
          </Field>
          <Field label="Overlay Image (floating inset)">
            <ImagePicker
              value={val("overlayImage")}
              onChange={url => setDraft(p => ({ ...p, overlayImage: url }))}
              uploadUrl="/api/admin/upload/about"
            />
          </Field>
        </div>
      </div>

      <div className="border-t pt-4">
        <Button className="gradient-primary text-primary-foreground" onClick={handleSave} disabled={update.isPending}>
          {update.isPending
            ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Saving…</>
            : <><Save className="mr-1.5 h-4 w-4" /> Save Our Story</>}
        </Button>
      </div>
    </div>
  );
}

// ── Why Choose Us Tab ─────────────────────────────────────────────────────────

const EMPTY_WHY: SaveWhyChooseUsItemInput = {
  title: "", titleDa: "", description: "", descriptionDa: "", icon: "ChefHat", sortOrder: 0, isActive: true,
};

function WhyChooseUsTab() {
  const { data: items = [], isLoading } = useAdminWhyChooseUs();
  const createItem = useCreateWhyChooseUs();
  const deleteItem = useDeleteWhyChooseUs();

  const [showModal, setShowModal] = useState(false);
  const [editId,    setEditId]    = useState<number | null>(null);
  const [form,      setForm]      = useState<SaveWhyChooseUsItemInput>(EMPTY_WHY);

  const updateItem = useUpdateWhyChooseUs(editId ?? 0);
  const isSaving   = createItem.isPending || updateItem.isPending;

  const openCreate = () => { setEditId(null); setForm({ ...EMPTY_WHY, sortOrder: items.length }); setShowModal(true); };
  const openEdit   = (w: WhyChooseUsItemDto) => {
    setEditId(w.id);
    setForm({ title: w.title, titleDa: w.titleDa, description: w.description, descriptionDa: w.descriptionDa, icon: w.icon, sortOrder: w.sortOrder, isActive: w.isActive });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required."); return; }
    try {
      if (editId !== null) { await updateItem.mutateAsync(form); toast.success("Item updated"); }
      else                 { await createItem.mutateAsync(form); toast.success("Item added"); }
      setShowModal(false);
    } catch { toast.error("Failed to save"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" className="gradient-primary text-primary-foreground h-9" onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" /> Add Item
        </Button>
      </div>

      {isLoading ? (
        <Loader text="Loading items…" />
      ) : items.length === 0 ? (
        <Empty label='No items yet. Click "Add Item" to create one.' />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(w => (
            <div key={w.id} className="group relative rounded-2xl border bg-card p-5 shadow-soft text-center">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl gradient-primary text-primary-foreground text-xs font-bold">
                {w.icon[0]}
              </div>
              <div className="font-semibold text-sm">{w.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{w.titleDa}</div>
              <div className="text-xs text-muted-foreground mt-2 line-clamp-2">{w.description}</div>
              {!w.isActive && (
                <span className="mt-2 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">Hidden</span>
              )}
              <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                <button onClick={() => openEdit(w)} className="grid h-6 w-6 place-items-center rounded-full bg-white shadow text-gray-600 hover:text-primary"><Pencil className="h-3 w-3" /></button>
                <button onClick={() => deleteItem.mutate(w.id, { onSuccess: () => toast.success("Deleted"), onError: () => toast.error("Failed") })} className="grid h-6 w-6 place-items-center rounded-full bg-white shadow text-red-400 hover:text-red-600"><Trash2 className="h-3 w-3" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title={editId !== null ? "Edit Item" : "Add Item"} onClose={() => setShowModal(false)}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Title (EN)"><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></Field>
            <Field label="Title (DA)"><Input value={form.titleDa} onChange={e => setForm(p => ({ ...p, titleDa: e.target.value }))} /></Field>
          </div>
          <Field label="Description (EN)"><Textarea rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></Field>
          <Field label="Description (DA)"><Textarea rows={2} value={form.descriptionDa} onChange={e => setForm(p => ({ ...p, descriptionDa: e.target.value }))} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Icon">
              <select value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                {WHY_ICONS.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </Field>
            <Field label="Sort Order"><Input type="number" min={0} value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: Number(e.target.value) }))} /></Field>
          </div>
          <div className="flex items-center gap-2.5">
            <Switch checked={form.isActive} onCheckedChange={v => setForm(p => ({ ...p, isActive: v }))} />
            <span className="text-sm font-medium">{form.isActive ? "Visible" : "Hidden"}</span>
          </div>
          <ModalFooter onClose={() => setShowModal(false)} onSave={handleSave} isSaving={isSaving} isEdit={editId !== null} />
        </Modal>
      )}
    </div>
  );
}

// ── Slide Row ─────────────────────────────────────────────────────────────────

function SlideRow({ slide, onEdit, onDelete, onReorder }: {
  slide: HeroSlideDto;
  onEdit: () => void;
  onDelete: () => void;
  onReorder: (dir: "up" | "down") => void;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="h-16 w-28 shrink-0 overflow-hidden rounded-lg border bg-gray-100">
        <img src={resolveUrl(slide.imageUrl)} alt={slide.title} className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{slide.title}</span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${slide.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
            {slide.isActive ? "Active" : "Inactive"}
          </span>
        </div>
        {slide.subtitle && <div className="text-xs text-muted-foreground mt-0.5 truncate">{slide.subtitle}</div>}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onReorder("up")}>
          <GripVertical className="h-4 w-4 text-muted-foreground rotate-90" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
          <Pencil className="h-4 w-4 text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function Loader({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground py-12 text-sm">
      <Loader2 className="h-4 w-4 animate-spin" /> {text}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center text-muted-foreground text-sm">
      {label}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div className={`fixed left-1/2 top-1/2 z-50 w-[95%] ${wide ? "max-w-2xl" : "max-w-lg"} -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
        {children}
      </div>
    </>
  );
}

function ModalFooter({ onClose, onSave, isSaving, isEdit }: { onClose: () => void; onSave: () => void; isSaving: boolean; isEdit: boolean }) {
  return (
    <div className="flex items-center justify-end gap-2 pt-2 border-t">
      <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
      <Button className="gradient-primary text-primary-foreground" onClick={onSave} disabled={isSaving}>
        {isSaving ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Saving…</> : (isEdit ? "Update" : "Save")}
      </Button>
    </div>
  );
}
