import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { adminFetch } from "@/lib/admin-api";
import { Student } from "./types";
import { AsyncBody, Card, ConfirmDialog, Field, PageHeader, Pill, TableWrap, Td, Th } from "./shared";
import { useAction } from "./useAction";
import { formatDate, levelLabel, useAdminData } from "./utils";

/** The admin pages a sub-admin can be given. Keys match the backend. */
export const PAGE_OPTIONS: { key: string; label: string; hint: string }[] = [
  { key: "students", label: "Students", hint: "Directory, roles (HOC), flags" },
  { key: "freshers", label: "Freshers", hint: "Assign matric numbers" },
  { key: "idcards", label: "ID Cards", hint: "Requests and card generation" },
  { key: "payments", label: "Payments", hint: "Payments and course materials" },
  { key: "email", label: "Email", hint: "Send emails to groups" },
  { key: "settings", label: "Academic & Fees", hint: "Session, fees, welcome message" },
  { key: "executives", label: "Executives", hint: "Executive council listing" },
  { key: "events", label: "Events", hint: "Events and galleries" },
  { key: "blogs", label: "Blogs", hint: "Blog posts" },
  { key: "messages", label: "Messages", hint: "Contact-form messages" },
];

interface SubAdmin {
  id: number;
  student_id: number;
  full_name: string;
  matric_no: string;
  level: string;
  department: string | null;
  permissions: string[];
  created_by: string | null;
  created_at: string;
}

const pageLabel = (key: string) => PAGE_OPTIONS.find((p) => p.key === key)?.label || key;

const Admins = () => {
  const { data, loading, error, reload } = useAdminData<SubAdmin[]>("/admin/admins", []);
  const { data: students } = useAdminData<Student[]>("/admin/students", []);
  const { busy, run } = useAction();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SubAdmin | null>(null);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<{ matric: string; name: string } | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [removing, setRemoving] = useState<SubAdmin | null>(null);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2 || picked) return [];
    return students
      .filter((s) => s.level !== "alumni" && s.matric_no && `${s.full_name} ${s.matric_no}`.toLowerCase().includes(q))
      .slice(0, 6);
  }, [students, query, picked]);

  const openAdd = () => {
    setEditing(null);
    setQuery("");
    setPicked(null);
    setPages([]);
    setOpen(true);
  };

  const openEdit = (admin: SubAdmin) => {
    setEditing(admin);
    setPicked({ matric: admin.matric_no, name: admin.full_name });
    setPages(admin.permissions);
    setOpen(true);
  };

  const toggle = (key: string) => setPages((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]));

  const save = async () => {
    if (!picked) return;
    const ok = await run(
      () => adminFetch("/admin/admins", { method: "POST", body: JSON.stringify({ matric_no: picked.matric, permissions: pages }) }),
      editing ? `${picked.name}'s access was updated.` : `${picked.name} is now an admin.`,
    );
    if (ok) {
      setOpen(false);
      reload();
    }
  };

  const remove = async () => {
    if (!removing) return;
    const ok = await run(() => adminFetch(`/admin/admins/${removing.student_id}`, { method: "DELETE" }), `${removing.full_name} is no longer an admin.`);
    setRemoving(null);
    if (ok) reload();
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Admins"
        description="Give a student access to specific admin pages. They sign in at the admin page with their matric number and their own portal password."
        actions={<Button className="rounded-full" onClick={openAdd}>Add admin</Button>}
      />
      <Card>
        <AsyncBody loading={loading} error={error} empty={data.length === 0} emptyTitle="No sub-admins yet" emptyDescription="You are the super admin. Add a student to share some admin pages." onRetry={reload}>
          <TableWrap>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Matric</Th>
                <Th>Level</Th>
                <Th>Can access</Th>
                <Th>Added</Th>
                <Th className="text-right">Action</Th>
              </tr>
            </thead>
            <tbody>
              {data.map((a) => (
                <tr key={a.id}>
                  <Td className="font-semibold">{a.full_name}</Td>
                  <Td className="text-xs">{a.matric_no}</Td>
                  <Td className="text-xs">{levelLabel(a.level)}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {a.permissions.map((p) => <Pill key={p} tone="blue">{pageLabel(p)}</Pill>)}
                    </div>
                  </Td>
                  <Td className="text-xs">{formatDate(a.created_at)}</Td>
                  <Td className="text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button size="sm" variant="outline" className="h-8 rounded-full px-3 text-xs" onClick={() => openEdit(a)}>Edit pages</Button>
                      <Button size="sm" variant="outline" className="h-8 rounded-full px-3 text-xs text-red-600" onClick={() => setRemoving(a)}>Remove</Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </AsyncBody>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit admin access" : "Add an admin"}</DialogTitle>
            <DialogDescription>
              {editing ? `Choose the pages ${editing.full_name} can use.` : "Find the student by name or matric number, then choose the pages they can use."}
            </DialogDescription>
          </DialogHeader>

          {!editing && (
            <Field label="Student">
              {picked ? (
                <div className="flex items-center justify-between rounded-full border border-border bg-muted/30 px-4 py-2 text-sm">
                  <span><strong>{picked.name}</strong> <span className="text-muted-foreground">({picked.matric})</span></span>
                  <button type="button" className="text-xs font-semibold text-primary" onClick={() => { setPicked(null); setQuery(""); }}>Change</button>
                </div>
              ) : (
                <>
                  <Input className="rounded-full" placeholder="Type a name or matric number" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
                  {suggestions.length > 0 && (
                    <ul className="mt-2 overflow-hidden rounded-2xl border border-border">
                      {suggestions.map((s) => (
                        <li key={s.id}>
                          <button
                            type="button"
                            className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-muted/40"
                            onClick={() => setPicked({ matric: String(s.matric_no), name: s.full_name })}
                          >
                            <span>{s.full_name}</span>
                            <span className="text-xs text-muted-foreground">{s.matric_no} · {levelLabel(s.level)}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </Field>
          )}

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pages they can use</span>
              <button type="button" className="text-xs font-semibold text-primary" onClick={() => setPages(pages.length === PAGE_OPTIONS.length ? [] : PAGE_OPTIONS.map((p) => p.key))}>
                {pages.length === PAGE_OPTIONS.length ? "Clear all" : "Select all"}
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {PAGE_OPTIONS.map((p) => (
                <label key={p.key} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border p-3 hover:bg-muted/30">
                  <Checkbox checked={pages.includes(p.key)} onCheckedChange={() => toggle(p.key)} className="mt-0.5" />
                  <span>
                    <span className="block text-sm font-semibold">{p.label}</span>
                    <span className="block text-xs text-muted-foreground">{p.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            They must already have set their own portal password. Only you (the super admin) can add or remove admins.
          </p>

          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="rounded-full" disabled={busy || !picked || pages.length === 0} onClick={save}>
              {editing ? "Save access" : "Make admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title="Remove admin access?"
        description={`${removing?.full_name} will no longer be able to sign in to the admin. Their student account is not affected.`}
        confirmLabel="Remove"
        destructive
        onConfirm={remove}
      />
    </div>
  );
};

export default Admins;
