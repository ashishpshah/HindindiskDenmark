import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Pencil, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { BASE } from "@/lib/api/client";
import {
  useAdminAboutSettings, useUpdateAboutSettings,
  useAdminAboutStats, useCreateAboutStat, useUpdateAboutStat, useDeleteAboutStat, type SaveAboutStatInput,
  useAdminAboutMvv, useCreateAboutMvv, useUpdateAboutMvv, useDeleteAboutMvv, type SaveAboutMvvInput,
  useAdminAboutTimeline, useCreateAboutTimeline, useUpdateAboutTimeline, useDeleteAboutTimeline, type SaveAboutTimelineInput,
  useAdminAboutTeam, useCreateTeamMember, useUpdateTeamMember, useDeleteTeamMember, type SaveTeamMemberInput,
  type AboutStatDto, type AboutMvvDto, type AboutTimelineDto, type TeamMemberDto,
} from "@/hooks/useAboutPage";

export const Route = createFileRoute("/admin/website/About")({ component: AboutAdmin });

type Tab = "images" | "stats" | "mvv" | "timeline" | "team";

function resolveUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${BASE}${url}`;
}

const MVV_ICONS = ["Target", "Sparkles", "Heart", "Star", "Shield", "Leaf"];

// ─────────────────────────────────────────────────────────────────────────────

function AboutAdmin() {
  const [tab, setTab] = useState<Tab>("images");

  const tabs: { key: Tab; label: string }[] = [
    { key: "images",   label: "Page Images" },
    { key: "stats",    label: "Stats" },
    { key: "mvv",      label: "Mission / Vision / Values" },
    { key: "timeline", label: "Timeline" },
    { key: "team",     label: "Team Members" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">About Page</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage all About page content</p>
      </div>

      <div className="flex gap-1 border-b">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            data-tagid={`button-website-about-tab-${t.key}`}
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

      <div>
        {tab === "images"   && <ImagesTab />}
        {tab === "stats"    && <StatsTab />}
        {tab === "mvv"      && <MvvTab />}
        {tab === "timeline" && <TimelineTab />}
        {tab === "team"     && <TeamTab />}
      </div>
    </div>
  );
}

// ── Images Tab ────────────────────────────────────────────────────────────────

function ImagesTab() {
  const { data: settings, isLoading } = useAdminAboutSettings();
  const update = useUpdateAboutSettings();

  const [hero,  setHero]  = useState<string | null>(null);
  const [story, setStory] = useState<string | null>(null);

  const heroVal  = hero  ?? settings?.heroImage  ?? "";
  const storyVal = story ?? settings?.storyImage ?? "";

  const handleSave = async () => {
    try {
      await update.mutateAsync({ heroImage: heroVal, storyImage: storyVal });
      toast.success("Images saved");
      setHero(null); setStory(null);
    } catch { toast.error("Failed to save"); }
  };

  if (isLoading) return <Loader />;

  return (
    <div className="space-y-10 max-w-2xl">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">About Page</h3>
        <div className="space-y-1.5">
          <Label>Hero Banner Image</Label>
          <ImagePicker value={heroVal} onChange={setHero} uploadUrl="/api/admin/upload/about" />
        </div>
        <div className="space-y-1.5">
          <Label>Story Section Image (left column)</Label>
          <ImagePicker value={storyVal} onChange={setStory} uploadUrl="/api/admin/upload/about" />
        </div>
      </div>

      <Button className="gradient-primary text-primary-foreground" onClick={handleSave} disabled={update.isPending} data-tagid="button-website-about-images-save">
        {update.isPending ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Saving…</> : <><Save className="mr-1.5 h-4 w-4" /> Save Images</>}
      </Button>
    </div>
  );
}

// ── Stats Tab ─────────────────────────────────────────────────────────────────

const EMPTY_STAT: SaveAboutStatInput = { value: "", label: "", labelDa: "", sortOrder: 0 };

function StatsTab() {
  const { data: stats = [], isLoading } = useAdminAboutStats();
  const createStat = useCreateAboutStat();
  const deleteStat = useDeleteAboutStat();

  const [showModal, setShowModal] = useState(false);
  const [editId,    setEditId]    = useState<number | null>(null);
  const [form,      setForm]      = useState<SaveAboutStatInput>(EMPTY_STAT);

  const updateStat = useUpdateAboutStat(editId ?? 0);
  const isSaving   = createStat.isPending || updateStat.isPending;

  const openCreate = () => { setEditId(null); setForm({ ...EMPTY_STAT, sortOrder: stats.length }); setShowModal(true); };
  const openEdit   = (s: AboutStatDto) => { setEditId(s.id); setForm({ value: s.value, label: s.label, labelDa: s.labelDa, sortOrder: s.sortOrder }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.value.trim() || !form.label.trim()) { toast.error("Value and Label are required."); return; }
    try {
      if (editId !== null) { await updateStat.mutateAsync(form); toast.success("Stat updated"); }
      else                 { await createStat.mutateAsync(form); toast.success("Stat added"); }
      setShowModal(false);
    } catch { toast.error("Failed to save"); }
  };

  if (isLoading) return <Loader />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" className="gradient-primary text-primary-foreground h-9" data-tagid="button-website-about-stats-add" onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" /> Add Stat
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(s => (
          <div key={s.id} className="rounded-xl border bg-card p-4 shadow-soft relative group">
            <div className="font-display text-3xl font-bold text-gradient">{s.value}</div>
            <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            <div className="text-xs text-muted-foreground/70">{s.labelDa}</div>
            <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
              <button onClick={() => openEdit(s)} data-tagid={`button-website-about-stats-edit-${s.id}`} className="grid h-6 w-6 place-items-center rounded-full bg-white shadow text-gray-600 hover:text-primary"><Pencil className="h-3 w-3" /></button>
              <button onClick={() => deleteStat.mutate(s.id, { onSuccess: () => toast.success("Deleted"), onError: () => toast.error("Failed") })} data-tagid={`button-website-about-stats-delete-${s.id}`} className="grid h-6 w-6 place-items-center rounded-full bg-white shadow text-red-400 hover:text-red-600"><Trash2 className="h-3 w-3" /></button>
            </div>
          </div>
        ))}
      </div>
      {showModal && (
        <Modal title={editId !== null ? "Edit Stat" : "Add Stat"} onClose={() => setShowModal(false)}>
          <Field label="Value (e.g. 20+)"><Input value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} placeholder="20+" data-tagid="input-website-about-stats-value" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Label (EN)"><Input value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))} placeholder="Years Experience" data-tagid="input-website-about-stats-label" /></Field>
            <Field label="Label (DA)"><Input value={form.labelDa} onChange={e => setForm(p => ({ ...p, labelDa: e.target.value }))} placeholder="Års erfaring" data-tagid="input-website-about-stats-labelda" /></Field>
          </div>
          <Field label="Sort Order"><Input type="number" min={0} value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: Number(e.target.value) }))} className="w-24" data-tagid="input-website-about-stats-sortorder" /></Field>
          <ModalFooter onClose={() => setShowModal(false)} onSave={handleSave} isSaving={isSaving} isEdit={editId !== null} />
        </Modal>
      )}
    </div>
  );
}

// ── MVV Tab ───────────────────────────────────────────────────────────────────

const EMPTY_MVV: SaveAboutMvvInput = { title: "", titleDa: "", description: "", descriptionDa: "", icon: "Target", sortOrder: 0 };

function MvvTab() {
  const { data: mvvList = [], isLoading } = useAdminAboutMvv();
  const createMvv = useCreateAboutMvv();
  const deleteMvv = useDeleteAboutMvv();

  const [showModal, setShowModal] = useState(false);
  const [editId,    setEditId]    = useState<number | null>(null);
  const [form,      setForm]      = useState<SaveAboutMvvInput>(EMPTY_MVV);

  const updateMvv = useUpdateAboutMvv(editId ?? 0);
  const isSaving  = createMvv.isPending || updateMvv.isPending;

  const openCreate = () => { setEditId(null); setForm({ ...EMPTY_MVV, sortOrder: mvvList.length }); setShowModal(true); };
  const openEdit   = (m: AboutMvvDto) => { setEditId(m.id); setForm({ title: m.title, titleDa: m.titleDa, description: m.description, descriptionDa: m.descriptionDa, icon: m.icon, sortOrder: m.sortOrder }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required."); return; }
    try {
      if (editId !== null) { await updateMvv.mutateAsync(form); toast.success("Updated"); }
      else                 { await createMvv.mutateAsync(form); toast.success("Added"); }
      setShowModal(false);
    } catch { toast.error("Failed to save"); }
  };

  if (isLoading) return <Loader />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" className="gradient-primary text-primary-foreground h-9" data-tagid="button-website-about-mvv-add" onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" /> Add Item
        </Button>
      </div>
      <div className="space-y-3">
        {mvvList.map(m => (
          <div key={m.id} className="flex items-start gap-4 rounded-xl border bg-card p-4 shadow-soft group relative">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gradient-primary text-primary-foreground text-xs font-bold">{m.icon[0]}</div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold">{m.title} <span className="text-muted-foreground text-xs">/ {m.titleDa}</span></div>
              <div className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{m.description}</div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
              <button onClick={() => openEdit(m)} data-tagid={`button-website-about-mvv-edit-${m.id}`} className="grid h-7 w-7 place-items-center rounded-full bg-white/90 shadow text-gray-600 hover:text-primary"><Pencil className="h-3.5 w-3.5" /></button>
              <button onClick={() => deleteMvv.mutate(m.id, { onSuccess: () => toast.success("Deleted"), onError: () => toast.error("Failed") })} data-tagid={`button-website-about-mvv-delete-${m.id}`} className="grid h-7 w-7 place-items-center rounded-full bg-white/90 shadow text-red-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
      {showModal && (
        <Modal title={editId !== null ? "Edit MVV Item" : "Add MVV Item"} onClose={() => setShowModal(false)}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Title (EN)"><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} data-tagid="input-website-about-mvv-title" /></Field>
            <Field label="Title (DA)"><Input value={form.titleDa} onChange={e => setForm(p => ({ ...p, titleDa: e.target.value }))} data-tagid="input-website-about-mvv-titleda" /></Field>
          </div>
          <Field label="Description (EN)"><Textarea rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} data-tagid="textarea-website-about-mvv-description" /></Field>
          <Field label="Description (DA)"><Textarea rows={2} value={form.descriptionDa} onChange={e => setForm(p => ({ ...p, descriptionDa: e.target.value }))} data-tagid="textarea-website-about-mvv-descriptionda" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Icon">
              <select value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} className="w-full rounded-md border bg-background px-3 py-2 text-sm" data-tagid="select-website-about-mvv-icon">
                {MVV_ICONS.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </Field>
            <Field label="Sort Order"><Input type="number" min={0} value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: Number(e.target.value) }))} data-tagid="input-website-about-mvv-sortorder" /></Field>
          </div>
          <ModalFooter onClose={() => setShowModal(false)} onSave={handleSave} isSaving={isSaving} isEdit={editId !== null} />
        </Modal>
      )}
    </div>
  );
}

// ── Timeline Tab ──────────────────────────────────────────────────────────────

const EMPTY_TL: SaveAboutTimelineInput = { year: "", title: "", titleDa: "", description: "", descriptionDa: "", sortOrder: 0 };

function TimelineTab() {
  const { data: items = [], isLoading } = useAdminAboutTimeline();
  const createTl = useCreateAboutTimeline();
  const deleteTl = useDeleteAboutTimeline();

  const [showModal, setShowModal] = useState(false);
  const [editId,    setEditId]    = useState<number | null>(null);
  const [form,      setForm]      = useState<SaveAboutTimelineInput>(EMPTY_TL);

  const updateTl = useUpdateAboutTimeline(editId ?? 0);
  const isSaving = createTl.isPending || updateTl.isPending;

  const openCreate = () => { setEditId(null); setForm({ ...EMPTY_TL, sortOrder: items.length }); setShowModal(true); };
  const openEdit   = (t: AboutTimelineDto) => { setEditId(t.id); setForm({ year: t.year, title: t.title, titleDa: t.titleDa, description: t.description, descriptionDa: t.descriptionDa, sortOrder: t.sortOrder }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.year.trim() || !form.title.trim()) { toast.error("Year and Title are required."); return; }
    try {
      if (editId !== null) { await updateTl.mutateAsync(form); toast.success("Updated"); }
      else                 { await createTl.mutateAsync(form); toast.success("Added"); }
      setShowModal(false);
    } catch { toast.error("Failed to save"); }
  };

  if (isLoading) return <Loader />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" className="gradient-primary text-primary-foreground h-9" data-tagid="button-website-about-timeline-add" onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" /> Add Event
        </Button>
      </div>
      <div className="space-y-3">
        {items.map(t => (
          <div key={t.id} className="flex items-start gap-4 rounded-xl border bg-card p-4 shadow-soft group relative">
            <div className="font-display text-2xl font-extrabold text-primary w-14 shrink-0">{t.year}</div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold">{t.title} <span className="text-muted-foreground text-xs">/ {t.titleDa}</span></div>
              <div className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{t.description}</div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
              <button onClick={() => openEdit(t)} data-tagid={`button-website-about-timeline-edit-${t.id}`} className="grid h-7 w-7 place-items-center rounded-full bg-white/90 shadow text-gray-600 hover:text-primary"><Pencil className="h-3.5 w-3.5" /></button>
              <button onClick={() => deleteTl.mutate(t.id, { onSuccess: () => toast.success("Deleted"), onError: () => toast.error("Failed") })} data-tagid={`button-website-about-timeline-delete-${t.id}`} className="grid h-7 w-7 place-items-center rounded-full bg-white/90 shadow text-red-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
      {showModal && (
        <Modal title={editId !== null ? "Edit Timeline Event" : "Add Timeline Event"} onClose={() => setShowModal(false)}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Year"><Input value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))} placeholder="2024" data-tagid="input-website-about-timeline-year" /></Field>
            <Field label="Sort Order"><Input type="number" min={0} value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: Number(e.target.value) }))} data-tagid="input-website-about-timeline-sortorder" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Title (EN)"><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} data-tagid="input-website-about-timeline-title" /></Field>
            <Field label="Title (DA)"><Input value={form.titleDa} onChange={e => setForm(p => ({ ...p, titleDa: e.target.value }))} data-tagid="input-website-about-timeline-titleda" /></Field>
          </div>
          <Field label="Description (EN)"><Textarea rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} data-tagid="textarea-website-about-timeline-description" /></Field>
          <Field label="Description (DA)"><Textarea rows={2} value={form.descriptionDa} onChange={e => setForm(p => ({ ...p, descriptionDa: e.target.value }))} data-tagid="textarea-website-about-timeline-descriptionda" /></Field>
          <ModalFooter onClose={() => setShowModal(false)} onSave={handleSave} isSaving={isSaving} isEdit={editId !== null} />
        </Modal>
      )}
    </div>
  );
}

// ── Team Tab ──────────────────────────────────────────────────────────────────

const EMPTY_TEAM: SaveTeamMemberInput = { name: "", role: "", roleDa: "", image: "", sortOrder: 0, isActive: true };

function TeamTab() {
  const { data: members = [], isLoading } = useAdminAboutTeam();
  const createMember = useCreateTeamMember();
  const deleteMember = useDeleteTeamMember();

  const [showModal, setShowModal] = useState(false);
  const [editId,    setEditId]    = useState<number | null>(null);
  const [form,      setForm]      = useState<SaveTeamMemberInput>(EMPTY_TEAM);

  const updateMember = useUpdateTeamMember(editId ?? 0);
  const isSaving     = createMember.isPending || updateMember.isPending;

  const openCreate = () => { setEditId(null); setForm({ ...EMPTY_TEAM, sortOrder: members.length }); setShowModal(true); };
  const openEdit   = (m: TeamMemberDto) => { setEditId(m.id); setForm({ name: m.name, role: m.role, roleDa: m.roleDa, image: m.image, sortOrder: m.sortOrder, isActive: m.isActive }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Name is required."); return; }
    try {
      if (editId !== null) { await updateMember.mutateAsync(form); toast.success("Updated"); }
      else                 { await createMember.mutateAsync(form); toast.success("Added"); }
      setShowModal(false);
    } catch { toast.error("Failed to save"); }
  };

  if (isLoading) return <Loader />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" className="gradient-primary text-primary-foreground h-9" data-tagid="button-website-about-team-add" onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" /> Add Member
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {members.map(m => (
          <div key={m.id} className="group relative overflow-hidden rounded-2xl border bg-card shadow-soft">
            <img src={resolveUrl(m.image)} alt={m.name} className="aspect-[3/4] w-full object-cover" />
            {!m.isActive && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">Hidden</span>
              </div>
            )}
            <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition group-hover:opacity-100">
              <button onClick={() => openEdit(m)} data-tagid={`button-website-about-team-edit-${m.id}`} className="grid h-7 w-7 place-items-center rounded-full bg-white/90 text-gray-700 shadow hover:text-primary"><Pencil className="h-3.5 w-3.5" /></button>
              <button onClick={() => deleteMember.mutate(m.id, { onSuccess: () => toast.success("Deleted"), onError: () => toast.error("Failed") })} data-tagid={`button-website-about-team-delete-${m.id}`} className="grid h-7 w-7 place-items-center rounded-full bg-white/90 text-red-500 shadow hover:text-red-700"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
            <div className="p-3 text-center">
              <div className="font-semibold text-sm">{m.name}</div>
              <div className="text-xs text-primary">{m.role}</div>
            </div>
          </div>
        ))}
      </div>
      {showModal && (
        <Modal title={editId !== null ? "Edit Team Member" : "Add Team Member"} onClose={() => setShowModal(false)}>
          <div className="space-y-1.5">
            <Label>Photo</Label>
            <ImagePicker value={form.image} onChange={url => setForm(p => ({ ...p, image: url }))} uploadUrl="/api/admin/upload/team" />
          </div>
          <Field label="Name"><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Chef John Doe" data-tagid="input-website-about-team-name" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Role (EN)"><Input value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} placeholder="Head Chef" data-tagid="input-website-about-team-role" /></Field>
            <Field label="Role (DA)"><Input value={form.roleDa} onChange={e => setForm(p => ({ ...p, roleDa: e.target.value }))} placeholder="Chefkok" data-tagid="input-website-about-team-roleda" /></Field>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <Switch checked={form.isActive} onCheckedChange={v => setForm(p => ({ ...p, isActive: v }))} data-tagid="button-website-about-team-active" />
              <span className="text-sm font-medium">{form.isActive ? "Visible" : "Hidden"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm">Sort</Label>
              <Input type="number" min={0} value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: Number(e.target.value) }))} className="h-8 w-20 text-sm" data-tagid="input-website-about-team-sortorder" />
            </div>
          </div>
          <ModalFooter onClose={() => setShowModal(false)} onSave={handleSave} isSaving={isSaving} isEdit={editId !== null} />
        </Modal>
      )}
    </div>
  );
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function Loader() {
  return (
    <div className="flex items-center gap-2 text-muted-foreground py-12 text-sm">
      <Loader2 className="h-4 w-4 animate-spin" /> Loading…
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

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} data-tagid="button-website-about-modal-backdrop" />
      <div className="fixed left-1/2 top-1/2 z-50 w-[95%] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} data-tagid="button-website-about-modal-close"><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
        {children}
      </div>
    </>
  );
}

function ModalFooter({ onClose, onSave, isSaving, isEdit }: { onClose: () => void; onSave: () => void; isSaving: boolean; isEdit: boolean }) {
  return (
    <div className="flex items-center justify-end gap-2 pt-2 border-t">
      <Button variant="outline" onClick={onClose} disabled={isSaving} data-tagid="button-website-about-modal-cancel">Cancel</Button>
      <Button className="gradient-primary text-primary-foreground" onClick={onSave} disabled={isSaving} data-tagid="button-website-about-modal-save">
        {isSaving ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Saving…</> : (isEdit ? "Update" : "Add")}
      </Button>
    </div>
  );
}
