import { useRef, useState } from "react";
import { ImagePlus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { adminFetch } from "@/lib/admin-api";
import { resolveImageUrl } from "@/lib/api";
import { AdminDashboard, EventItem } from "./types";
import { AsyncBody, Card, ConfirmDialog, Field, PageHeader, Pill, SelectField } from "./shared";
import { ImageField, useImageUpload } from "./ImageField";
import { useAction } from "./useAction";
import { slugify, useAdminData } from "./utils";

const empty: EventItem = { id: "", slug: "", title: "", event_status: "upcoming", start_date: "", end_date: "", location: "", description: "", cover_image_url: "", registration_url: "", flyer_folder: "", sort_order: 0, is_active: true };

const Events = () => {
  const { data, loading, error, reload } = useAdminData<AdminDashboard | null>("/admin/dashboard", null);
  const { busy, run } = useAction();
  const { uploading, upload } = useImageUpload();
  const [form, setForm] = useState<EventItem | null>(null);
  const [del, setDel] = useState<EventItem | null>(null);
  const [galleryDel, setGalleryDel] = useState<{ eventId: EventItem["id"]; imageId: string | number } | null>(null);
  const [galleryTarget, setGalleryTarget] = useState<EventItem["id"] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const list = data?.events || [];
  const set = <K extends keyof EventItem>(k: K, v: EventItem[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));

  const save = async () => {
    if (!form) return;
    const ok = await run(async () => {
      const method = form.id ? "PUT" : "POST";
      const endpoint = form.id ? `/admin/events/${form.id}` : "/admin/events";
      await adminFetch(endpoint, { method, body: JSON.stringify(form) });
    }, "Event saved.");
    if (ok) {
      setForm(null);
      reload();
    }
  };

  const addGallery = async (file: File) => {
    if (galleryTarget === null) return;
    const url = await upload(file);
    if (!url) return;
    const ok = await run(
      () => adminFetch(`/admin/events/${galleryTarget}/gallery`, { method: "POST", body: JSON.stringify({ image_url: url }) }),
      "Gallery image added.",
    );
    if (ok) reload();
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Events" description="Events and their photo galleries." actions={<Button className="rounded-full" onClick={() => setForm({ ...empty })}><Plus className="mr-1.5 h-4 w-4" />Add event</Button>} />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) addGallery(file);
        }}
      />
      <AsyncBody loading={loading} error={error} empty={list.length === 0} emptyTitle="No events yet" onRetry={reload}>
        <div className="space-y-4">
          {list.map((item) => (
            <Card key={item.id}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-base font-bold">{item.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Pill tone={item.event_status === "upcoming" ? "blue" : item.event_status === "current" ? "green" : "slate"}>{item.event_status}</Pill>
                    <span>{item.location || "No location"}</span>
                    <span>{item.start_date || "No date"}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" className="h-8 rounded-full px-3 text-xs" disabled={uploading || busy} onClick={() => { setGalleryTarget(item.id); fileRef.current?.click(); }}>
                    <ImagePlus className="mr-1.5 h-3.5 w-3.5" />{uploading && galleryTarget === item.id ? "Uploading..." : "Add gallery image"}
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 rounded-full px-3 text-xs" onClick={() => setForm({ ...item, start_date: item.start_date ? String(item.start_date).slice(0, 16) : "", end_date: item.end_date ? String(item.end_date).slice(0, 16) : "" })}>Edit</Button>
                  <Button size="sm" variant="outline" className="h-8 rounded-full px-3 text-xs text-red-600" onClick={() => setDel(item)}>Delete</Button>
                </div>
              </div>
              {item.gallery && item.gallery.length > 0 && (
                <div className="mt-4 border-t border-border pt-3">
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">{item.gallery.length} gallery image(s)</p>
                  <div className="flex flex-wrap gap-2">
                    {item.gallery.map((g) => (
                      <div key={g.id} className="group relative h-24 w-24 overflow-hidden rounded-2xl border border-border">
                        <img src={resolveImageUrl(g.image_url)} alt="Gallery" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          aria-label="Delete image"
                          className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100"
                          onClick={() => setGalleryDel({ eventId: item.id, imageId: g.id })}
                        >
                          <Trash2 className="h-5 w-5 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </AsyncBody>

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-2xl">
          <DialogHeader><DialogTitle>{form?.id ? "Edit event" : "Add event"}</DialogTitle></DialogHeader>
          {form && (
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Title"><Input className="rounded-full" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || slugify(e.target.value) })} /></Field>
              <Field label="Slug"><Input className="rounded-full" value={form.slug} onChange={(e) => set("slug", e.target.value)} /></Field>
              <Field label="Status"><SelectField className="w-full" value={form.event_status} onChange={(v) => set("event_status", v)} options={[{ value: "upcoming", label: "Upcoming" }, { value: "current", label: "Current" }, { value: "past", label: "Past" }]} /></Field>
              <Field label="Location"><Input className="rounded-full" value={form.location} onChange={(e) => set("location", e.target.value)} /></Field>
              <Field label="Starts"><Input className="rounded-full" type="datetime-local" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} /></Field>
              <Field label="Ends"><Input className="rounded-full" type="datetime-local" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} /></Field>
              <div className="md:col-span-2"><Field label="Cover image"><ImageField value={form.cover_image_url} onChange={(v) => set("cover_image_url", v)} placeholder="Cover image URL" /></Field></div>
              <Field label="Registration URL"><Input className="rounded-full" value={form.registration_url} onChange={(e) => set("registration_url", e.target.value)} /></Field>
              <Field label="Flyer folder name"><Input className="rounded-full" value={form.flyer_folder} onChange={(e) => set("flyer_folder", e.target.value)} /></Field>
              <Field label="Sort order"><Input className="rounded-full" type="number" value={form.sort_order} onChange={(e) => set("sort_order", Number(e.target.value))} /></Field>
              <div className="md:col-span-2"><Field label="Description"><Textarea rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} /></Field></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setForm(null)}>Cancel</Button>
            <Button className="rounded-full" disabled={busy || !form?.title.trim()} onClick={save}>{form?.id ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!del}
        onOpenChange={(o) => !o && setDel(null)}
        title="Delete event?"
        description={`"${del?.title}" and its gallery will be removed.`}
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!del) return;
          const ok = await run(() => adminFetch(`/admin/events/${del.id}`, { method: "DELETE" }), "Event deleted.");
          setDel(null);
          if (ok) reload();
        }}
      />
      <ConfirmDialog
        open={!!galleryDel}
        onOpenChange={(o) => !o && setGalleryDel(null)}
        title="Delete gallery image?"
        description="This image will be removed from the event gallery."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!galleryDel) return;
          const ok = await run(() => adminFetch(`/admin/events/${galleryDel.eventId}/gallery/${galleryDel.imageId}`, { method: "DELETE" }), "Gallery image deleted.");
          setGalleryDel(null);
          if (ok) reload();
        }}
      />
    </div>
  );
};

export default Events;
