import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { adminFetch } from "@/lib/admin-api";
import { Fresher } from "./types";
import { AsyncBody, Card, FilterBar, PageHeader, Pill, SearchInput, SelectField, TableWrap, Td, Th } from "./shared";
import { useToast } from "@/hooks/use-toast";
import { formatDate, useAdminData, useDebouncedValue } from "./utils";

const STATUS: Record<string, { label: string; tone: "amber" | "green" | "blue" | "red" }> = {
  pending_verification: { label: "Pending verification", tone: "amber" },
  active: { label: "Active", tone: "green" },
  promoted: { label: "Promoted", tone: "blue" },
  disabled: { label: "Disabled", tone: "red" },
};

const Freshers = () => {
  const { data, loading, error, reload } = useAdminData<Fresher[]>("/admin/freshers", []);
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [target, setTarget] = useState<Fresher | null>(null);
  const [matric, setMatric] = useState("");
  const [dialogError, setDialogError] = useState<string | null>(null);
  const q = useDebouncedValue(search.trim().toLowerCase());

  const rows = useMemo(
    () =>
      data.filter((f) => {
        if (status && f.status !== status) return false;
        return !q || `${f.full_name} ${f.email} ${f.matric_no || ""}`.toLowerCase().includes(q);
      }),
    [data, q, status],
  );

  const open = (f: Fresher) => {
    setTarget(f);
    setMatric("");
    setDialogError(null);
  };

  const assign = async () => {
    if (!target) return;
    setDialogError(null);
    setBusy(true);
    try {
      await adminFetch(`/admin/freshers/${target.id}/matric`, { method: "POST", body: JSON.stringify({ matric_no: matric.trim() }) });
      toast({ title: "Matric number assigned", description: `${target.full_name} is now a 100L student (${matric.trim()}).` });
      setTarget(null);
      reload();
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : "Could not assign matric number.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Freshers" description="New 100L students who registered without a matric number." />
      <Card>
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search name, email or matric" />
          <SelectField label="Status" value={status} onChange={setStatus} options={[{ value: "", label: "All statuses" }, ...Object.entries(STATUS).map(([value, s]) => ({ value, label: s.label }))]} />
        </FilterBar>
        <div className="mt-4">
          <AsyncBody loading={loading} error={error} empty={rows.length === 0} emptyTitle="No freshers found" onRetry={reload}>
            <TableWrap>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Department</Th>
                  <Th>Status</Th>
                  <Th>Matric</Th>
                  <Th>Registered</Th>
                  <Th className="text-right">Action</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((f) => {
                  const s = STATUS[f.status] || { label: f.status, tone: "amber" as const };
                  return (
                    <tr key={f.id}>
                      <Td className="font-semibold">{f.full_name}</Td>
                      <Td className="text-xs">{f.email}</Td>
                      <Td className="text-xs">{f.department || "-"}</Td>
                      <Td><Pill tone={s.tone}>{s.label}</Pill></Td>
                      <Td className="text-xs">{f.matric_no || "-"}</Td>
                      <Td className="text-xs">{formatDate(f.created_at)}</Td>
                      <Td className="text-right">
                        {f.status === "promoted" || f.matric_no ? null : (
                          <Button size="sm" className="h-8 rounded-full px-3 text-xs" onClick={() => open(f)}>
                            Assign matric number
                          </Button>
                        )}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrap>
          </AsyncBody>
        </div>
      </Card>

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Assign matric number</DialogTitle>
            <DialogDescription>
              {target?.full_name} will become a 100L student with this matric number and can then get an ID card.
            </DialogDescription>
          </DialogHeader>
          <Input className="rounded-full" placeholder="Matric number" value={matric} onChange={(e) => setMatric(e.target.value)} autoFocus />
          {dialogError && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{dialogError}</p>}
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setTarget(null)}>Cancel</Button>
            <Button className="rounded-full" disabled={busy || !matric.trim()} onClick={assign}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Freshers;
