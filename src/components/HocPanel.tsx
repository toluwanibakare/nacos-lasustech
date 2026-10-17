import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle, Archive, ArchiveRestore, CheckCircle2, Download, ExternalLink, FileText, Loader2,
  Pencil, Plus, Search, Undo2, Upload, Users, X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL, fetchApi } from "@/lib/api";
import {
  ALLOWED_EXTENSIONS, FILE_ACCEPT, FREE_KINDS, KIND_LABEL, MAX_FILE_BYTES, PAID_KINDS,
  downloadTextFile, fileExtension, formatBytes, isFreeKind, naira, safeFilename, salesToCsv,
  type MaterialItem, type MaterialKind, type MaterialSale,
} from "@/lib/materials";

interface HocMe { full_name: string; level: string; department: string | null; post: string }
type Tab = "add" | "library" | "paid";
interface ItemForm { title: string; course_code: string; description: string; price: string }

const emptyForm: ItemForm = { title: "", course_code: "", description: "", price: "" };
const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");
const fmtDate = (s: string | null | undefined) => {
  if (!s) return "";
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
};

const checkFile = (f: File): string | null => {
  const ext = fileExtension(f.name);
  if (!ALLOWED_EXTENSIONS.includes(ext)) return `That file type is not allowed. Use one of: ${ALLOWED_EXTENSIONS.join(", ")}.`;
  if (f.size > MAX_FILE_BYTES) return `That file is ${formatBytes(f.size)}. The limit is ${formatBytes(MAX_FILE_BYTES)}.`;
  return null;
};

const sendMultipart = async (path: string, method: "POST" | "PUT", form: FormData) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE_URL.replace(/\/$/, "")}${path}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
};

const buildForm = (kind: MaterialKind, f: ItemForm, file: File | null, withKind: boolean) => {
  const fd = new FormData();
  if (withKind) fd.append("kind", kind);
  fd.append("title", f.title.trim());
  fd.append("course_code", f.course_code.trim());
  fd.append("description", f.description.trim());
  if (isFreeKind(kind)) {
    if (file) fd.append("file", file);
  } else {
    fd.append("price", String(Number(f.price)));
  }
  return fd;
};

const btnTall = "min-h-[44px] rounded-full";

const FilePicker = ({
  file, onFile, label, existing,
}: { file: File | null; onFile: (f: File | null) => void; label: string; existing?: string | null }) => {
  const { toast } = useToast();
  const ref = useRef<HTMLInputElement>(null);
  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const problem = checkFile(f);
    if (problem) return toast({ title: "File not accepted", description: problem, variant: "destructive" });
    onFile(f);
  };
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <input ref={ref} type="file" accept={FILE_ACCEPT} className="hidden" onChange={onPick} />
      {file ? (
        <div className="flex items-center gap-3 rounded-2xl border p-3">
          <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="break-all text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
          </div>
          <Button type="button" variant="outline" className={btnTall} onClick={() => onFile(null)}>
            <X className="mr-1 h-4 w-4" /> Remove
          </Button>
        </div>
      ) : (
        <>
          {existing && <p className="break-all text-xs text-muted-foreground">Current file: {existing}</p>}
          <Button type="button" variant="outline" className={`${btnTall} w-full sm:w-auto`} onClick={() => ref.current?.click()}>
            <Upload className="mr-2 h-4 w-4" /> Choose file
          </Button>
          <p className="text-xs text-muted-foreground">Up to {formatBytes(MAX_FILE_BYTES)}. {ALLOWED_EXTENSIONS.join(", ")}.</p>
        </>
      )}
    </div>
  );
};

const CommonFields = ({ form, setForm, paid }: { form: ItemForm; setForm: (f: ItemForm) => void; paid: boolean }) => (
  <div className="grid gap-4 sm:grid-cols-2">
    <div className="space-y-1.5 sm:col-span-2">
      <Label>Title</Label>
      <Input className="min-h-[44px]" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
    </div>
    <div className="space-y-1.5">
      <Label>Course code (optional)</Label>
      <Input className="min-h-[44px]" value={form.course_code} onChange={(e) => setForm({ ...form, course_code: e.target.value })} />
    </div>
    {paid && (
      <div className="space-y-1.5">
        <Label>Price (₦)</Label>
        <Input className="min-h-[44px]" type="number" min={1} inputMode="numeric" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
      </div>
    )}
    <div className="space-y-1.5 sm:col-span-2">
      <Label>Description (optional)</Label>
      <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
    </div>
  </div>
);

const KindBadge = ({ kind }: { kind: MaterialKind }) => (
  <Badge variant="secondary" className="rounded-full">{KIND_LABEL[kind]}</Badge>
);

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="min-w-0 rounded-xl border p-2 text-center">
    <p className="text-[11px] text-muted-foreground">{label}</p>
    <p className="break-words text-sm font-semibold">{value}</p>
  </div>
);

// ---------------------------------------------------------------- Edit dialog

const EditDialog = ({ item, onClose, onSaved }: { item: MaterialItem | null; onClose: () => void; onSaved: () => Promise<void> }) => {
  const { toast } = useToast();
  const [form, setForm] = useState<ItemForm>(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({ title: item.title, course_code: item.course_code || "", description: item.description || "", price: String(item.price || "") });
      setFile(null);
    }
  }, [item]);

  if (!item) return null;
  const free = isFreeKind(item.kind);

  const save = async () => {
    if (saving) return;
    if (!form.title.trim()) return toast({ title: "Title is required", variant: "destructive" });
    if (!free && !(Number(form.price) > 0)) return toast({ title: "Price must be greater than zero", variant: "destructive" });
    setSaving(true);
    try {
      await sendMultipart(`/hoc/items/${item.id}`, "PUT", buildForm(item.kind, form, file, false));
      await onSaved();
      toast({ title: "Item updated" });
      onClose();
    } catch (err) {
      toast({ title: "Could not update item", description: errMsg(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent className="max-h-[90dvh] w-[calc(100vw-1.5rem)] max-w-lg overflow-y-auto rounded-2xl shadow-none">
        <DialogHeader><DialogTitle>Edit {KIND_LABEL[item.kind].toLowerCase()}</DialogTitle></DialogHeader>
        <CommonFields form={form} setForm={setForm} paid={!free} />
        {free && <FilePicker file={file} onFile={setFile} label="Replace file (optional)" existing={item.file_name} />}
        <Button className={`${btnTall} w-full`} onClick={save} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save changes
        </Button>
      </DialogContent>
    </Dialog>
  );
};

// ------------------------------------------------------------ Collection list

type CollectFilter = "all" | "pending" | "done";

const CollectionSheet = ({ item, onClose }: { item: MaterialItem | null; onClose: () => void }) => {
  const { toast } = useToast();
  const [sales, setSales] = useState<MaterialSale[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CollectFilter>("all");
  const busy = useRef<Set<number>>(new Set());
  const [, force] = useState(0);

  const load = useCallback(async (id: number) => {
    setSales(null);
    setError(null);
    try {
      const data = await fetchApi(`/hoc/items/${id}/sales`);
      setSales(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(errMsg(e));
    }
  }, []);

  useEffect(() => {
    if (item) {
      setQuery("");
      setFilter("all");
      busy.current = new Set();
      void load(item.id);
    }
  }, [item, load]);

  const total = sales?.length ?? 0;
  const collected = sales ? sales.filter((s) => s.received).length : 0;
  const notYet = total - collected;

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (sales || []).filter((s) => {
      if (filter === "pending" && s.received) return false;
      if (filter === "done" && !s.received) return false;
      if (!q) return true;
      return s.full_name.toLowerCase().includes(q) || (s.matric_no || "").toLowerCase().includes(q);
    });
  }, [sales, query, filter]);

  const toggle = async (s: MaterialSale) => {
    if (!item || busy.current.has(s.payment_id)) return;
    busy.current.add(s.payment_id);
    force((n) => n + 1);
    const next = !s.received;
    const apply = (received: boolean, at: string | null) =>
      setSales((cur) => (cur || []).map((x) => (x.payment_id === s.payment_id ? { ...x, received, received_at: at } : x)));
    apply(next, next ? new Date().toISOString() : null);
    try {
      const res = await fetchApi(`/hoc/items/${item.id}/sales/${s.payment_id}/received`, {
        method: "PUT",
        body: JSON.stringify({ received: next }),
      });
      if (res && typeof res.received === "boolean") apply(res.received, res.received_at || null);
      toast({ title: next ? "Marked as received" : "Undone", description: s.full_name });
    } catch (e) {
      apply(s.received, s.received_at);
      toast({ title: "Could not update", description: errMsg(e), variant: "destructive" });
    } finally {
      busy.current.delete(s.payment_id);
      force((n) => n + 1);
    }
  };

  const downloadCsv = () => {
    if (!item || !sales || sales.length === 0) return;
    downloadTextFile(`${safeFilename(item.title)}-collection-list.csv`, salesToCsv(sales));
    toast({ title: "Collection list downloaded" });
  };

  const action = (s: MaterialSale) => {
    const isBusy = busy.current.has(s.payment_id);
    if (!s.received) {
      return (
        <div className="flex md:justify-end">
          <Button className={`${btnTall} w-full md:w-auto`} disabled={isBusy} onClick={() => toggle(s)}>
            {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} Mark received
          </Button>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-between gap-2 md:justify-end">
        <div className="min-w-0">
          <p className="flex items-center gap-1 text-sm font-medium text-green-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> Received
          </p>
          <p className="text-xs text-muted-foreground">{fmtDate(s.received_at)}</p>
        </div>
        <Button variant="outline" className={btnTall} disabled={isBusy} onClick={() => toggle(s)}>
          {isBusy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Undo2 className="mr-1 h-4 w-4" />} Undo
        </Button>
      </div>
    );
  };

  const pills: [CollectFilter, string][] = [["all", "All"], ["pending", "Not yet"], ["done", "Collected"]];

  return (
    <Sheet open={!!item} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="mx-auto flex h-[92dvh] w-full flex-col gap-0 overflow-hidden rounded-t-3xl p-0 shadow-none md:max-w-4xl"
      >
        <SheetHeader className="space-y-2 border-b p-4 pr-12 text-left">
          <SheetTitle className="break-words">{item?.title}</SheetTitle>
          <SheetDescription className="sr-only">People who paid for this item and whether they collected it.</SheetDescription>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="rounded-full">Paid {total}</Badge>
            <Badge className="rounded-full bg-green-600 text-white hover:bg-green-600">Collected {collected}</Badge>
            <Badge variant="outline" className="rounded-full">Not yet {notYet}</Badge>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="min-h-[44px] rounded-full pl-9"
              placeholder="Search name or matric number"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {pills.map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setFilter(k)}
                className={`min-h-[44px] flex-1 rounded-full border px-3 text-sm sm:flex-none sm:px-5 ${filter === k ? "border-primary bg-primary text-primary-foreground" : "bg-background"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {error ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
              <AlertCircle className="mx-auto mb-2 h-6 w-6 text-destructive" />
              <p className="mb-3 text-sm">{error}</p>
              <Button variant="outline" className={btnTall} onClick={() => item && load(item.id)}>Try again</Button>
            </div>
          ) : !sales ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading...</div>
          ) : total === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Nobody has paid for this yet.</p>
          ) : shown.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No one matches your search.</p>
          ) : (
            <>
              <ul className="space-y-3 md:hidden">
                {shown.map((s) => (
                  <li key={s.payment_id} className="space-y-3 rounded-2xl border p-3">
                    <div className="min-w-0">
                      <p className="break-words font-medium">{s.full_name}</p>
                      <p className="break-all text-sm text-muted-foreground">{s.matric_no || "No matric number"}</p>
                      <p className="mt-1 text-sm">{naira(s.amount)} <span className="text-muted-foreground">paid {fmtDate(s.created_at)}</span></p>
                    </div>
                    {action(s)}
                  </li>
                ))}
              </ul>
              <div className="hidden overflow-hidden rounded-2xl border md:block">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="p-3 font-medium">Name</th>
                      <th className="p-3 font-medium">Matric number</th>
                      <th className="p-3 font-medium">Amount</th>
                      <th className="p-3 font-medium">Paid on</th>
                      <th className="p-3 text-right font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((s) => (
                      <tr key={s.payment_id} className="border-t align-middle">
                        <td className="p-3 font-medium">{s.full_name}</td>
                        <td className="p-3">{s.matric_no || ""}</td>
                        <td className="p-3">{naira(s.amount)}</td>
                        <td className="p-3">{fmtDate(s.created_at)}</td>
                        <td className="p-3">{action(s)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
        <div className="border-t bg-background p-3">
          <Button variant="outline" className={`${btnTall} w-full md:ml-auto md:flex md:w-auto`} disabled={total === 0} onClick={downloadCsv}>
            <Download className="mr-2 h-4 w-4" /> Download CSV{total > 0 ? ` (${total} ${total === 1 ? "person" : "people"})` : ""}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// ----------------------------------------------------------------- Main panel

const HocPanel = () => {
  const { toast } = useToast();
  const [me, setMe] = useState<HocMe | null>(null);
  const [items, setItems] = useState<MaterialItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("add");

  // On a phone the tab row scrolls sideways; make sure the chosen tab is always in view.
  useEffect(() => {
    document.querySelector('[data-active-tab="true"]')?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [tab]);

  const [kind, setKind] = useState<MaterialKind | null>(null);
  const [form, setForm] = useState<ItemForm>(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);
  const [progress, setProgress] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<MaterialItem | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<MaterialItem | null>(null);
  const [collectFor, setCollectFor] = useState<MaterialItem | null>(null);
  const statusBusy = useRef<Set<number>>(new Set());

  const loadItems = useCallback(async () => {
    const data = await fetchApi("/hoc/items");
    setItems(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    Promise.all([fetchApi("/hoc/me"), loadItems()])
      .then(([m]) => setMe(m))
      .catch((e) => setError(errMsg(e)));
  }, [loadItems]);

  // The server sends the announcement emails in the background, so the HOC can close this page.
  // This just watches its progress.
  const watchCampaign = async (id: number, total: number, warning?: string | null) => {
    setProgress({ sent: 0, failed: 0, total });
    if (warning) setNotice(warning);
    for (let i = 0; i < 150; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      try {
        const c = await fetchApi(`/hoc/campaigns/${id}`);
        setProgress({ sent: c.sent_count || 0, failed: c.failed_count || 0, total: c.with_email || total });
        if (c.status !== "sending") {
          toast({ title: "Class emailed", description: `${c.sent_count || 0} of ${c.with_email || total} people were told about the new material.` });
          return;
        }
      } catch {
        return; // keep the page quiet; the server carries on regardless
      }
    }
  };

  const onPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (posting) return;
    if (!kind) return toast({ title: "Choose what you are adding first", variant: "destructive" });
    if (!form.title.trim()) return toast({ title: "Title is required", variant: "destructive" });
    const free = isFreeKind(kind);
    if (free && !file) return toast({ title: "Choose a file to upload", variant: "destructive" });
    if (!free && !(Number(form.price) > 0)) return toast({ title: "Price must be greater than zero", variant: "destructive" });
    setPosting(true);
    setProgress(null);
    setNotice(null);
    try {
      const res = await sendMultipart("/hoc/items", "POST", buildForm(kind, form, file, true));
      setForm(emptyForm);
      setFile(null);
      setKind(null);
      await loadItems();
      setTab(free ? "library" : "paid");
      const c = res?.campaign;
      if (!c) {
        toast({ title: "Material added" });
        setNotice("Item posted. No one in your class has an email on record yet, so no announcement was sent.");
      } else if (c.with_email > 0) {
        toast({ title: "Material added", description: "Emailing your class. You can leave this page." });
        void watchCampaign(c.id, c.with_email, c.warning);
      } else {
        toast({ title: "Material added" });
        setNotice(c.warning || "Item posted. No one in your class has an email on record yet, so no announcement was sent.");
      }
    } catch (err) {
      toast({ title: "Could not add material", description: errMsg(err), variant: "destructive" });
    } finally {
      setPosting(false);
    }
  };

  const setStatus = async (it: MaterialItem, status: "active" | "archived") => {
    if (statusBusy.current.has(it.id)) return;
    statusBusy.current.add(it.id);
    try {
      await fetchApi(`/hoc/items/${it.id}/status`, { method: "PUT", body: JSON.stringify({ status }) });
      await loadItems();
      toast({ title: status === "archived" ? "Item archived" : "Item restored" });
    } catch (err) {
      toast({ title: "Could not change status", description: errMsg(err), variant: "destructive" });
    } finally {
      statusBusy.current.delete(it.id);
    }
  };

  const free = useMemo(() => (items || []).filter((i) => isFreeKind(i.kind)), [items]);
  const paid = useMemo(() => (items || []).filter((i) => !isFreeKind(i.kind)), [items]);
  const filteredFree = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return free;
    return free.filter((i) => i.title.toLowerCase().includes(q) || (i.course_code || "").toLowerCase().includes(q));
  }, [free, search]);

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

  const classLabel = me.level === "100" && me.department ? `${me.level} Level, ${me.department}` : `${me.level} Level`;
  const pct = progress && progress.total > 0 ? Math.min(100, Math.round(((progress.sent + progress.failed) / progress.total) * 100)) : 0;
  const totBuyers = paid.reduce((n, i) => n + Number(i.buyers || 0), 0);
  const totCollected = paid.reduce((n, i) => n + Number(i.received_count || 0), 0);
  const totRevenue = paid.reduce((n, i) => n + Number(i.revenue || 0), 0);
  const isPaidKind = !!kind && !isFreeKind(kind);

  const tabs: [Tab, string, number | null][] = [["add", "Add material", null], ["library", "Library (free)", free.length], ["paid", "Paid items", paid.length]];

  const KindChip = ({ k }: { k: MaterialKind }) => (
    <button
      type="button"
      onClick={() => { setKind(k); if (isFreeKind(k) !== isFreeKind(kind || k)) setFile(null); }}
      className={`min-h-[48px] rounded-full border px-5 text-sm font-medium ${kind === k ? "border-primary bg-primary text-primary-foreground" : "bg-background"}`}
    >
      {KIND_LABEL[k]}
    </button>
  );

  const ItemActions = ({ it, children }: { it: MaterialItem; children?: React.ReactNode }) => (
    <div className="flex flex-wrap gap-2">
      {children}
      <Button variant="outline" className={btnTall} onClick={() => setEditing(it)}><Pencil className="mr-1 h-4 w-4" /> Edit</Button>
      {it.status === "active" ? (
        <Button variant="outline" className={btnTall} onClick={() => setArchiveTarget(it)}><Archive className="mr-1 h-4 w-4" /> Archive</Button>
      ) : (
        <Button variant="outline" className={btnTall} onClick={() => setStatus(it, "active")}><ArchiveRestore className="mr-1 h-4 w-4" /> Restore</Button>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="min-w-0">
        <h2 className="break-words text-xl font-semibold">{me.full_name}</h2>
        <p className="text-sm text-muted-foreground">{me.post}, {classLabel}</p>
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map(([k, label, count]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            data-active-tab={tab === k}
            className={`min-h-[44px] shrink-0 rounded-full border px-4 text-sm font-medium ${tab === k ? "border-primary bg-primary text-primary-foreground" : "bg-background"}`}
          >
            {label}{count !== null ? ` (${count})` : ""}
          </button>
        ))}
      </div>

      {(progress || notice) && (
        <div className="space-y-2 rounded-2xl border p-3">
          {progress && (
            <div className="space-y-1.5">
              <Progress value={pct} />
              <p className="text-sm text-muted-foreground">
                {progress.sent} of {progress.total} emailed{progress.failed > 0 ? ` (${progress.failed} failed)` : ""}
              </p>
            </div>
          )}
          {notice && <p className="rounded-xl bg-muted p-3 text-sm">{notice}</p>}
        </div>
      )}

      {tab === "add" && (
        <form onSubmit={onPost} className="space-y-5 rounded-2xl border p-4">
          <div className="space-y-1">
            <h3 className="font-medium">Add course material</h3>
            <p className="text-sm text-muted-foreground">
              This goes to {classLabel} only. Everyone there is emailed to log in and see it.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Free to download (upload a file)</p>
            <div className="flex flex-wrap gap-2">{FREE_KINDS.map((k) => <KindChip key={k} k={k} />)}</div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Paid (students pay, then collect from you)</p>
            <div className="flex flex-wrap gap-2">{PAID_KINDS.map((k) => <KindChip key={k} k={k} />)}</div>
          </div>

          {kind && (
            <>
              <CommonFields form={form} setForm={setForm} paid={isPaidKind} />
              {isPaidKind ? (
                <p className="rounded-xl bg-muted p-3 text-sm">
                  No file is uploaded for paid items. Students pay here, then you hand it over and mark it received.
                </p>
              ) : (
                <FilePicker file={file} onFile={setFile} label="File (required)" />
              )}
              <Button type="submit" className={`${btnTall} w-full sm:w-auto`} disabled={posting}>
                {posting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                {posting ? "Adding..." : `Add ${KIND_LABEL[kind].toLowerCase()}`}
              </Button>
            </>
          )}
        </form>
      )}

      {tab === "library" && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="min-h-[44px] rounded-full pl-9" placeholder="Search title or course code" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {free.length === 0 ? (
            <div className="rounded-2xl border p-8 text-center">
              <p className="mb-3 text-sm text-muted-foreground">No free files yet. Upload notes, a PDF or past questions for your class.</p>
              <Button className={btnTall} onClick={() => setTab("add")}><Plus className="mr-2 h-4 w-4" /> Add material</Button>
            </div>
          ) : filteredFree.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nothing matches your search.</p>
          ) : (
            filteredFree.map((it) => (
              <div key={it.id} className={`space-y-3 rounded-2xl border p-4 ${it.status === "archived" ? "opacity-60" : ""}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <KindBadge kind={it.kind} />
                  {it.status === "archived" && <Badge variant="outline" className="rounded-full">Archived</Badge>}
                </div>
                <div className="min-w-0">
                  <p className="break-words font-medium">{it.title}</p>
                  <p className="text-xs text-muted-foreground">{it.course_code || "No course code"}</p>
                  {it.file_name && (
                    <p className="mt-1 break-all text-xs text-muted-foreground">
                      {it.file_name}{it.file_size ? ` (${formatBytes(it.file_size)})` : ""}
                    </p>
                  )}
                </div>
                <ItemActions it={it}>
                  {it.file_url && (
                    <Button asChild className={btnTall}>
                      <a href={it.file_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-1 h-4 w-4" /> Open</a>
                    </Button>
                  )}
                </ItemActions>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "paid" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Items" value={paid.length} />
            <Stat label="Total paid" value={totBuyers} />
            <Stat label="Total collected" value={totCollected} />
            <Stat label="Total revenue" value={naira(totRevenue)} />
          </div>
          {paid.length === 0 ? (
            <div className="rounded-2xl border p-8 text-center">
              <p className="mb-3 text-sm text-muted-foreground">No paid items yet. Add a manual, workbook or textbook that students pay for and collect from you.</p>
              <Button className={btnTall} onClick={() => setTab("add")}><Plus className="mr-2 h-4 w-4" /> Add material</Button>
            </div>
          ) : (
            paid.map((it) => {
              const buyers = Number(it.buyers || 0);
              const got = Number(it.received_count || 0);
              return (
                <div key={it.id} className={`space-y-3 rounded-2xl border p-4 ${it.status === "archived" ? "opacity-60" : ""}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <KindBadge kind={it.kind} />
                    {it.status === "archived" && <Badge variant="outline" className="rounded-full">Archived</Badge>}
                  </div>
                  <div className="min-w-0">
                    <p className="break-words font-medium">{it.title}</p>
                    <p className="text-xs text-muted-foreground">{it.course_code || "No course code"} · {naira(it.price)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Stat label="Paid" value={buyers} />
                    <Stat label="Collected" value={got} />
                    <Stat label="Waiting" value={Math.max(0, buyers - got)} />
                    <Stat label="Revenue" value={naira(it.revenue)} />
                  </div>
                  <ItemActions it={it}>
                    <Button className={btnTall} onClick={() => setCollectFor(it)}><Users className="mr-1 h-4 w-4" /> Collection list</Button>
                  </ItemActions>
                </div>
              );
            })
          )}
        </div>
      )}

      <EditDialog item={editing} onClose={() => setEditing(null)} onSaved={loadItems} />
      <CollectionSheet item={collectFor} onClose={() => { setCollectFor(null); void loadItems().catch(() => undefined); }} />

      <AlertDialog open={!!archiveTarget} onOpenChange={(o) => !o && setArchiveTarget(null)}>
        <AlertDialogContent className="w-[calc(100vw-1.5rem)] rounded-2xl shadow-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this item?</AlertDialogTitle>
            <AlertDialogDescription>
              "{archiveTarget?.title}" will no longer be shown to your class. You can restore it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={btnTall}>Cancel</AlertDialogCancel>
            <AlertDialogAction className={btnTall} onClick={() => { if (archiveTarget) void setStatus(archiveTarget, "archived"); setArchiveTarget(null); }}>
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default HocPanel;
