import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { adminFetch } from "@/lib/admin-api";
import { AdminDashboard, Blog } from "./types";
import { AsyncBody, Card, ConfirmDialog, Field, PageHeader, Pill, TableWrap, Td, Th } from "./shared";
import { ImageField } from "./ImageField";
import { useAction } from "./useAction";
import { formatDate, slugify, useAdminData } from "./utils";

const empty: Blog = { id: "", slug: "", title: "", excerpt: "", content: "", author: "", category: "", image_url: "", published_at: "", is_published: true };

const Blogs = () => {
  const { data, loading, error, reload } = useAdminData<AdminDashboard | null>("/admin/dashboard", null);
  const { busy, run } = useAction();
  const [form, setForm] = useState<Blog | null>(null);
  const [del, setDel] = useState<Blog | null>(null);
  const list = data?.blogs || [];
  const set = <K extends keyof Blog>(k: K, v: Blog[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));

  const save = async () => {
    if (!form) return;
    const ok = await run(async () => {
      const method = form.id ? "PUT" : "POST";
      const endpoint = form.id ? `/admin/blogs/${form.id}` : "/admin/blogs";
      await adminFetch(endpoint, { method, body: JSON.stringify(form) });
    }, form.id ? "Blog post updated." : "Blog post added.");
    if (ok) {
      setForm(null);
      reload();
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Blogs" description="Articles shown on the public blog." actions={<Button className="rounded-full" onClick={() => setForm({ ...empty })}><Plus className="mr-1.5 h-4 w-4" />New post</Button>} />
      <Card>
        <AsyncBody loading={loading} error={error} empty={list.length === 0} emptyTitle="No blog posts yet" onRetry={reload}>
          <TableWrap>
            <thead><tr><Th>Title</Th><Th>Author</Th><Th>Category</Th><Th>Published</Th><Th>Status</Th><Th className="text-right">Actions</Th></tr></thead>
            <tbody>
              {list.map((b) => (
                <tr key={b.id}>
                  <Td className="font-semibold">{b.title}</Td>
                  <Td className="text-xs">{b.author || "-"}</Td>
                  <Td className="text-xs">{b.category || "-"}</Td>
                  <Td className="text-xs">{formatDate(b.published_at)}</Td>
                  <Td><Pill tone={b.is_published ? "green" : "slate"}>{b.is_published ? "Published" : "Draft"}</Pill></Td>
                  <Td className="text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button size="sm" variant="outline" className="h-8 rounded-full px-3 text-xs" onClick={() => setForm({ ...b, published_at: b.published_at ? String(b.published_at).slice(0, 10) : "" })}>Edit</Button>
                      <Button size="sm" variant="outline" className="h-8 rounded-full px-3 text-xs text-red-600" onClick={() => setDel(b)}>Delete</Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </AsyncBody>
      </Card>

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-2xl">
          <DialogHeader><DialogTitle>{form?.id ? "Edit blog post" : "New blog post"}</DialogTitle></DialogHeader>
          {form && (
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Title"><Input className="rounded-full" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.id ? form.slug : slugify(e.target.value) })} /></Field>
              <Field label="Slug"><Input className="rounded-full" value={form.slug} onChange={(e) => set("slug", e.target.value)} /></Field>
              <Field label="Author"><Input className="rounded-full" value={form.author} onChange={(e) => set("author", e.target.value)} /></Field>
              <Field label="Category"><Input className="rounded-full" value={form.category} onChange={(e) => set("category", e.target.value)} /></Field>
              <Field label="Publish date"><Input className="rounded-full" type="date" value={form.published_at} onChange={(e) => set("published_at", e.target.value)} /></Field>
              <Field label="Cover image"><ImageField value={form.image_url} onChange={(v) => set("image_url", v)} placeholder="Image URL" /></Field>
              <div className="md:col-span-2"><Field label="Excerpt"><Textarea rows={2} value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} /></Field></div>
              <div className="md:col-span-2"><Field label="Content"><Textarea rows={8} value={form.content} onChange={(e) => set("content", e.target.value)} /></Field></div>
              <label className="flex items-center gap-2 text-sm"><Switch checked={Boolean(form.is_published)} onCheckedChange={(v) => set("is_published", v)} /> Published</label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setForm(null)}>Cancel</Button>
            <Button className="rounded-full" disabled={busy || !form?.title.trim()} onClick={save}>{form?.id ? "Update" : "Publish"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!del}
        onOpenChange={(o) => !o && setDel(null)}
        title="Delete blog post?"
        description={`"${del?.title}" will be removed permanently.`}
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!del) return;
          const ok = await run(() => adminFetch(`/admin/blogs/${del.id}`, { method: "DELETE" }), "Blog post deleted.");
          setDel(null);
          if (ok) reload();
        }}
      />
    </div>
  );
};

export default Blogs;
