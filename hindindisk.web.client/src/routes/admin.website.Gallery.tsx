import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, GripVertical, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { BASE } from "@/lib/api/client";
import {
  useAdminGalleryImages, useCreateGalleryImage, useUpdateGalleryImage,
  useDeleteGalleryImage, type GalleryImageDto, type CreateGalleryImageInput,
} from "@/hooks/useGalleryImages";

export const Route = createFileRoute("/admin/website/Gallery")({ component: GalleryAdmin });

function resolveUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${BASE}${url}`;
}

const EMPTY: CreateGalleryImageInput = {
  url: "", caption: "", captionDa: "", sortOrder: 0, isActive: true,
};

function GalleryAdmin() {
  const { data: images = [], isLoading } = useAdminGalleryImages();
  const createImage = useCreateGalleryImage();
  const deleteImage = useDeleteGalleryImage();

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId]       = useState<number | null>(null);
  const [form, setForm]           = useState<CreateGalleryImageInput>(EMPTY);

  const updateImage = useUpdateGalleryImage(editId ?? 0);
  const isSaving    = createImage.isPending || updateImage.isPending;

  const openCreate = () => {
    setEditId(null);
    setForm({ ...EMPTY, sortOrder: images.length });
    setShowModal(true);
  };

  const openEdit = (img: GalleryImageDto) => {
    setEditId(img.id);
    setForm({
      url: img.url, caption: img.caption, captionDa: img.captionDa,
      sortOrder: img.sortOrder, isActive: img.isActive,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.url.trim()) { toast.error("Image URL is required."); return; }
    try {
      if (editId !== null) {
        await updateImage.mutateAsync({
          caption: form.caption, captionDa: form.captionDa,
          isActive: form.isActive, sortOrder: form.sortOrder,
        });
        toast.success("Image updated");
      } else {
        await createImage.mutateAsync(form);
        toast.success("Image added");
      }
      setShowModal(false);
    } catch { toast.error("Failed to save"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Gallery</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage gallery images</p>
        </div>
        <Button size="sm" className="gradient-primary text-primary-foreground h-9" onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" /> Add Image
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-12 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : images.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center text-muted-foreground text-sm">
          No gallery images yet. Click "Add Image" to upload one.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map(img => (
            <div key={img.id} className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <img
                src={resolveUrl(img.url)}
                alt={img.caption || "Gallery image"}
                className="aspect-square w-full object-cover"
              />
              {!img.isActive && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">Hidden</span>
                </div>
              )}
              <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition group-hover:opacity-100">
                <button
                  onClick={() => openEdit(img)}
                  className="grid h-7 w-7 place-items-center rounded-full bg-white/90 text-gray-700 shadow hover:text-primary"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => {
                    deleteImage.mutate(img.id, {
                      onSuccess: () => toast.success("Image deleted"),
                      onError:   () => toast.error("Failed to delete"),
                    });
                  }}
                  className="grid h-7 w-7 place-items-center rounded-full bg-white/90 text-red-500 shadow hover:text-red-700"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              {img.caption && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">{img.caption}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-[95%] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editId !== null ? "Edit Image" : "Add Image"}</h2>
              <button onClick={() => setShowModal(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>

            <div className="space-y-1.5">
              <Label>Image</Label>
              <ImagePicker
                value={form.url}
                onChange={url => setForm(p => ({ ...p, url }))}
                uploadUrl="/api/admin/upload/gallery"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Caption (EN)</Label>
                <Input value={form.caption} onChange={e => setForm(p => ({ ...p, caption: e.target.value }))} placeholder="Optional caption" />
              </div>
              <div className="space-y-1.5">
                <Label>Caption (DA)</Label>
                <Input value={form.captionDa} onChange={e => setForm(p => ({ ...p, captionDa: e.target.value }))} placeholder="Valgfri billedtekst" />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2.5">
                <Switch checked={form.isActive} onCheckedChange={v => setForm(p => ({ ...p, isActive: v }))} />
                <span className="text-sm font-medium">{form.isActive ? "Visible" : "Hidden"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm">Sort Order</Label>
                <Input type="number" min={0} value={form.sortOrder}
                  onChange={e => setForm(p => ({ ...p, sortOrder: Number(e.target.value) }))}
                  className="h-8 w-20 text-sm" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setShowModal(false)} disabled={isSaving}>Cancel</Button>
              <Button className="gradient-primary text-primary-foreground" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Saving…</> : (editId !== null ? "Update" : "Add")}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
