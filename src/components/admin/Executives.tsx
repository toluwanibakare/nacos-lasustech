import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { adminFetch } from "@/lib/admin-api";
import { resolveImageUrl } from "@/lib/api";
import { Executive } from "./types";
import { AsyncBody, Card, ConfirmDialog, Field, PageHeader, SelectField } from "./shared";
import { ImageField } from "./ImageField";
import { useAction } from "./useAction";
import { useAdminData } from "./utils";

const empty: Executive = { id: "", name: "", post: "", level: "", description: "", image_url: "", sort_order: 0, is_active: true };

const Executives = () => {
  // Executives belong to a session; the page opens on the current one.
  const sessions = useAdminData<{ current: string; sessions: string[] } | null>("/admin/executives/sessions", null);
  const [picked, setPicked] = useState("");
  const session = picked || sessions.data?.current || "";
  const { data: list, loading, error, reload } = useAdminData<Executive[]>(session ? `/admin/executives?session=${encodeURIComponent(session)}` : null, []);
  const { busy, run } = useAction();
  const [form, setForm] = useState<Executive | null>(null);
  const [del, setDel] = useState<Executive | null>(null);
  const sessionOptions = useMemo(
    () => (sessions.data?.sessions || []).map((s) => ({ value: s, label: s === sessions.data?.current ? `${s} (current)` : s })),
    [sessions.data],
  );
  const set = <K extends keyof Executive>(k: K, v: Executive[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));

  const save = async () => {
    if (!form) return;
    const ok = await run(async () => {
      const method = form.id ? "PUT" : "POST";
      const endpoint = form.id ? `/admin/executives/${form.id}` : "/admin/executives";
      await adminFetch(endpoint, { method, body: JSON.stringify({ ...form, session: form.session || session }) });
    }, form.id ? "Executive updated." : "Executive added.");
    if (ok) {
      setForm(null);
      reload();
      sessions.reload();
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Executives" description="The executive council for each session. Add the new council when it is announced; earlier sessions are kept." actions={<Button className="rounded-full" disabled={!session} onClick={() => setForm({ ...empty, session })}><Plus className="mr-1.5 h-4 w-4" />Add executive</Button>} />
      <Card>
        {sessionOptions.length > 0 && (
          <div className="mb-4">
            <SelectField label="Session" value={session} onChange={setPicked} options={sessionOptions} />
          </div>
        )}
        <AsyncBody loading={loading || sessions.loading} error={error || sessions.error} empty={list.length === 0} emptyTitle={`No executives for ${session || "this session"} yet`} emptyDescription="Use Add executive to build this session's council." onRetry={() => { sessions.reload(); reload(); }}>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((item) => (
              <div key={item.id} className="flex gap-3 rounded-2xl border border-border p-3">
                {item.image_url ? <img src={resolveImageUrl(item.image_url)} alt="" className="h-14 w-14 shrink-0 rounded-2xl object-cover" /> : <div className="h-14 w-14 shrink-0 rounded-2xl bg-[#f7fbf6]" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{item.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{item.post}{item.level ? ` - ${item.level}` : ""}</p>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="outline" className="h-7 rounded-full px-3 text-xs" onClick={() => setForm({ ...item })}>Edit</Button>
                    <Button size="sm" variant="outline" className="h-7 rounded-full px-3 text-xs text-red-600" onClick={() => setDel(item)}>Delete</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AsyncBody>
      </Card>

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-lg">
          <DialogHeader><DialogTitle>{form?.id ? "Edit executive" : "Add executive"}</DialogTitle></DialogHeader>
          {form && (
            <div className="space-y-3">
              <Field label="Full name"><Input className="rounded-full" value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
              <Field label="Post"><Input className="rounded-full" value={form.post} onChange={(e) => set("post", e.target.value)} /></Field>
              <Field label="Level"><Input className="rounded-full" value={form.level} onChange={(e) => set("level", e.target.value)} /></Field>
              <Field label="Image"><ImageField value={form.image_url} onChange={(v) => set("image_url", v)} placeholder="Image URL" /></Field>
              <Field label="Sort order"><Input className="rounded-full" type="number" value={form.sort_order} onChange={(e) => set("sort_order", Number(e.target.value))} /></Field>
              <Field label="Details"><Textarea value={form.description} onChange={(e) => set("description", e.target.value)} /></Field>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setForm(null)}>Cancel</Button>
            <Button className="rounded-full" disabled={busy || !form?.name.trim()} onClick={save}>{form?.id ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!del}
        onOpenChange={(o) => !o && setDel(null)}
        title="Delete executive?"
        description={`${del?.name} will be removed from the website.`}
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!del) return;
          const ok = await run(() => adminFetch(`/admin/executives/${del.id}`, { method: "DELETE" }), "Executive removed.");
          setDel(null);
          if (ok) reload();
        }}
      />
    </div>
  );
};

export default Executives;
