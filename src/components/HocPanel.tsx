import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Archive, ArchiveRestore, Download, Loader2, Pencil, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";

interface HocMe { full_name: string; level: string; post: string }
interface Item {
  id: number;
  title: string;
  course_code: string | null;
  description: string | null;
  price: number;
  department: string | null;
  status: "active" | "archived";
  buyers: number;
  revenue: number;
}
interface Sale { full_name: string; matric_no: string | null; amount: number; reference: string; created_at: string }
interface ItemForm { title: string; course_code: string; description: string; price: string; department: string }

const ALL = "__all__";
const emptyForm: ItemForm = { title: "", course_code: "", description: "", price: "", department: ALL };
const naira = (n: number) => `₦${Number(n || 0).toLocaleString()}`;
const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

const toPayload = (f: ItemForm) => ({
  title: f.title.trim(),
  course_code: f.course_code.trim() || undefined,
  description: f.description.trim() || undefined,
  price: Number(f.price),
  department: f.department === ALL ? undefined : f.department,
});

const validate = (f: ItemForm): string | null => {
  if (!f.title.trim()) return "Title is required";
  if (!(Number(f.price) > 0)) return "Price must be greater than zero";
  return null;
};

const ItemFields = ({ form, setForm, departments }: { form: ItemForm; setForm: (f: ItemForm) => void; departments: string[] }) => (
  <div className="grid gap-4 sm:grid-cols-2">
    <div className="space-y-1.5 sm:col-span-2">
      <Label>Title</Label>
      <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
    </div>
    <div className="space-y-1.5">
      <Label>Course code (optional)</Label>
      <Input value={form.course_code} onChange={(e) => setForm({ ...form, course_code: e.target.value })} />
    </div>
    <div className="space-y-1.5">
      <Label>Price (₦)</Label>
      <Input type="number" min={1} inputMode="numeric" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
    </div>
    <div className="space-y-1.5 sm:col-span-2">
      <Label>Description (optional)</Label>
      <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
    </div>
    <div className="space-y-1.5 sm:col-span-2">
      <Label>Department</Label>
      <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All departments</SelectItem>
          {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  </div>
);

const HocPanel = () => {
  const { toast } = useToast();
  const [me, setMe] = useState<HocMe | null>(null);
  const [items, setItems] = useState<Item[] | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<ItemForm>(emptyForm);
  const [posting, setPosting] = useState(false);
  const [progress, setProgress] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [editing, setEditing] = useState<Item | null>(null);
  const [editForm, setEditForm] = useState<ItemForm>(emptyForm);
  const [savingEdit, setSavingEdit] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<Item | null>(null);
  const [buyersFor, setBuyersFor] = useState<Item | null>(null);
  const [sales, setSales] = useState<Sale[] | null>(null);

  const loadItems = useCallback(async () => {
    const data = await fetchApi("/hoc/items");
    setItems(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    Promise.all([fetchApi("/hoc/me"), loadItems()])
      .then(([m]) => setMe(m))
      .catch((e) => setError(errMsg(e)));
    fetchApi("/content/settings")
      .then((s) => setDepartments(Array.isArray(s?.departments) ? s.departments : []))
      .catch(() => undefined);
  }, [loadItems]);

  const runCampaign = async (id: number, total: number, warning?: string | null) => {
    setProgress({ sent: 0, failed: 0, total });
    if (warning) setNotice(warning);
    // Bounded loop as a safety net against a server that never reports done.
    for (let i = 0; i < 1000; i++) {
      const r = await fetchApi(`/hoc/campaigns/${id}/send-batch`, { method: "POST" });
      const c = r?.campaign || {};
      setProgress({ sent: c.sent_count || 0, failed: c.failed_count || 0, total: c.with_email || total });
      if (r?.done) break;
    }
  };

  const onPost = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate(form);
    if (v) return toast({ title: v, variant: "destructive" });
    setPosting(true);
    setProgress(null);
    setNotice(null);
    try {
      const res = await fetchApi("/hoc/items", { method: "POST", body: JSON.stringify(toPayload(form)) });
      setForm(emptyForm);
      await loadItems();
      const c = res?.campaign;
      if (!c) {
        setNotice("Item posted. No one in your class has an email on record yet, so no announcement was sent.");
      } else if (c.with_email > 0) {
        toast({ title: "Item posted", description: "Sending announcement emails..." });
        await runCampaign(c.id, c.with_email, c.warning);
        toast({ title: "Announcement sent" });
      } else {
        setNotice(c.warning || "Item posted. No one in your class has an email on record yet, so no announcement was sent.");
      }
    } catch (err) {
      toast({ title: "Could not complete request", description: errMsg(err), variant: "destructive" });
    } finally {
      setPosting(false);
    }
  };

  const openEdit = (it: Item) => {
    setEditing(it);
    setEditForm({
      title: it.title,
      course_code: it.course_code || "",
      description: it.description || "",
      price: String(it.price),
      department: it.department || ALL,
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    const v = validate(editForm);
    if (v) return toast({ title: v, variant: "destructive" });
    setSavingEdit(true);
    try {
      await fetchApi(`/hoc/items/${editing.id}`, { method: "PUT", body: JSON.stringify(toPayload(editForm)) });
      setEditing(null);
      await loadItems();
      toast({ title: "Item updated" });
    } catch (err) {
      toast({ title: "Could not update item", description: errMsg(err), variant: "destructive" });
    } finally {
      setSavingEdit(false);
    }
  };

  const setStatus = async (it: Item, status: "active" | "archived") => {
    try {
      await fetchApi(`/hoc/items/${it.id}/status`, { method: "PUT", body: JSON.stringify({ status }) });
      await loadItems();
      toast({ title: status === "archived" ? "Item archived" : "Item restored" });
    } catch (err) {
      toast({ title: "Could not change status", description: errMsg(err), variant: "destructive" });
    }
  };

  const viewBuyers = async (it: Item) => {
    setBuyersFor(it);
    setSales(null);
    try {
      const data = await fetchApi(`/hoc/items/${it.id}/sales`);
      setSales(Array.isArray(data) ? data : []);
    } catch (err) {
      setBuyersFor(null);
      toast({ title: "Could not load buyers", description: errMsg(err), variant: "destructive" });
    }
  };

  const downloadCsv = () => {
    if (!sales || !buyersFor) return;
    const esc = (s: string) => `"${String(s ?? "").replace(/"/g, '""')}"`;
    const rows = [["Name", "Matric", "Amount", "Date"], ...sales.map((s) => [s.full_name, s.matric_no || "", String(s.amount), s.created_at])];
    const blob = new Blob([rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${buyersFor.title.replace(/\W+/g, "_")}_buyers.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <AlertCircle className="mx-auto mb-2 h-6 w-6 text-destructive" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }
  if (!me || !items) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading...
      </div>
    );
  }

  const totalBuyers = items.reduce((n, i) => n + Number(i.buyers || 0), 0);
  const totalRevenue = items.reduce((n, i) => n + Number(i.revenue || 0), 0);
  const pct = progress && progress.total > 0 ? Math.min(100, Math.round(((progress.sent + progress.failed) / progress.total) * 100)) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold">{me.full_name}</h2>
        <p className="text-sm text-muted-foreground">{me.post}, {me.level} Level</p>
      </div>

      <form onSubmit={onPost} className="space-y-4 rounded-2xl border p-4">
        <h3 className="font-medium">Post a new item</h3>
        <ItemFields form={form} setForm={setForm} departments={departments} />
        <Button type="submit" className="rounded-full" disabled={posting}>
          {posting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Post item
        </Button>
        {progress && (
          <div className="space-y-1.5">
            <Progress value={pct} />
            <p className="text-sm text-muted-foreground">
              {progress.sent} of {progress.total} emailed{progress.failed > 0 ? ` (${progress.failed} failed)` : ""}
            </p>
          </div>
        )}
        {notice && <p className="rounded-xl bg-muted p-3 text-sm">{notice}</p>}
      </form>

      <div className="space-y-3">
        <h3 className="font-medium">Your class items</h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[["Items", String(items.length)], ["Buyers", String(totalBuyers)], ["Revenue", naira(totalRevenue)]].map(([k, v]) => (
            <div key={k} className="rounded-2xl border p-3">
              <p className="text-xs text-muted-foreground">{k}</p>
              <p className="font-semibold">{v}</p>
            </div>
          ))}
        </div>
        {items.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No items yet.</p>}
        {items.map((it) => (
          <div key={it.id} className="space-y-3 rounded-2xl border p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">{it.title}</p>
                <p className="text-xs text-muted-foreground">{it.course_code || "No course code"} · {naira(it.price)}</p>
              </div>
              <Badge variant={it.status === "active" ? "default" : "secondary"} className="rounded-full">{it.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{it.buyers} buyers · {naira(it.revenue)}</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="rounded-full" onClick={() => openEdit(it)}><Pencil className="mr-1 h-3.5 w-3.5" /> Edit</Button>
              <Button size="sm" variant="outline" className="rounded-full" onClick={() => viewBuyers(it)}><Users className="mr-1 h-3.5 w-3.5" /> View buyers</Button>
              {it.status === "active" ? (
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => setArchiveTarget(it)}><Archive className="mr-1 h-3.5 w-3.5" /> Archive</Button>
              ) : (
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => setStatus(it, "active")}><ArchiveRestore className="mr-1 h-3.5 w-3.5" /> Unarchive</Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit item</DialogTitle></DialogHeader>
          <ItemFields form={editForm} setForm={setEditForm} departments={departments} />
          <Button className="rounded-full" onClick={saveEdit} disabled={savingEdit}>
            {savingEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save changes
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!buyersFor} onOpenChange={(o) => !o && setBuyersFor(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Buyers: {buyersFor?.title}</DialogTitle></DialogHeader>
          {!sales ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : sales.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No one has bought this yet.</p>
          ) : (
            <>
              <ul className="divide-y text-sm">
                {sales.map((s) => (
                  <li key={s.reference} className="flex flex-wrap justify-between gap-2 py-2">
                    <span>{s.full_name} <span className="text-muted-foreground">{s.matric_no || ""}</span></span>
                    <span>{naira(s.amount)} · {new Date(s.created_at).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="rounded-full" onClick={downloadCsv}><Download className="mr-2 h-4 w-4" /> Download CSV</Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!archiveTarget} onOpenChange={(o) => !o && setArchiveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this item?</AlertDialogTitle>
            <AlertDialogDescription>
              "{archiveTarget?.title}" will no longer be shown to your class. You can unarchive it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction className="rounded-full" onClick={() => { if (archiveTarget) setStatus(archiveTarget, "archived"); setArchiveTarget(null); }}>
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default HocPanel;
