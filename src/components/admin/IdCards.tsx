import { useMemo, useState } from "react";
import { Download, Flag, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { adminDownload, adminFetch } from "@/lib/admin-api";
import { IdRequest } from "./types";
import { AsyncBody, Card, FilterBar, PageHeader, Pill, SearchInput, SelectField, TableWrap, Td, Th } from "./shared";
import { useAction } from "./useAction";
import { downloadBlob, formatDate, formatNaira, levelLabel, useAdminData, useDebouncedValue } from "./utils";

const STATUS_LABEL: Record<string, string> = {
  awaiting_payment: "Awaiting payment",
  pending: "Paid, pending",
  processing: "Processing",
  ready: "Printed",
  collected: "Collected",
};
const STATUS_TONE: Record<string, "amber" | "blue" | "green" | "slate"> = {
  awaiting_payment: "slate",
  pending: "amber",
  processing: "blue",
  ready: "green",
  collected: "slate",
};
const EDITABLE = ["pending", "processing", "ready", "collected"];

const truthy = (v: unknown) => v === true || v === 1 || v === "1";
// Dues are shown as a reminder only; they do not stop a card being generated.
const isFlagged = (r: IdRequest) => truthy(r.flagged);
const duesOk = (r: IdRequest) => truthy(r.dues_paid) || truthy(r.dues_exempt);
// The ID card fee must be paid too: an unpaid request is still "awaiting_payment".
const cardPaid = (r: IdRequest) => r.status !== "awaiting_payment";
const canGenerate = (r: IdRequest) => Boolean(r.has_matric) && r.student_id != null && cardPaid(r) && !isFlagged(r);
// A card can be marked printed once it is paid for and in the queue.
const canPrint = (r: IdRequest) => r.status === "pending" || r.status === "processing";

const IdCards = () => {
  const { data, loading, error, reload } = useAdminData<IdRequest[]>("/admin/id-requests", []);
  const { busy, run } = useAction();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [group, setGroup] = useState("");
  const [department, setDepartment] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const q = useDebouncedValue(search.trim().toLowerCase());

  const rows = useMemo(
    () =>
      data.filter((r) => {
        if (status && r.status !== status) return false;
        // "fresher" stands in for 100 level for now; the other levels are stalites of that level.
        if (group === "fresher" && r.account_type !== "fresher") return false;
        if (group && group !== "fresher" && (r.account_type !== "student" || r.level !== group)) return false;
        if (department && r.department !== department) return false;
        return !q || `${r.full_name} ${r.matric_number || ""}`.toLowerCase().includes(q);
      }),
    [data, q, status, group, department],
  );

  // Taken from the requests themselves, so it works for any admin who can open this page.
  const departments = useMemo(() => Array.from(new Set(data.map((r) => r.department).filter(Boolean) as string[])).sort(), [data]);

  // Anyone who is not flagged can be ticked; each button then acts on the ticked people it applies to.
  const selectable = rows.filter((r) => !isFlagged(r));
  const withoutMatric = rows.filter((r) => !isFlagged(r) && !canGenerate(r)).length;
  const key = (r: IdRequest) => String(r.id);
  const ticked = data.filter((r) => selected.has(key(r)) && !isFlagged(r));
  const picked = ticked.filter(canGenerate);
  const toPrint = ticked.filter(canPrint);

  const toggle = (r: IdRequest) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key(r)) ? next.delete(key(r)) : next.add(key(r));
      return next;
    });

  const allSelected = selectable.length > 0 && selectable.every((r) => selected.has(key(r)));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(selectable.map(key)));

  const setRowStatus = (r: IdRequest, next: string) =>
    run(async () => {
      await adminFetch(`/admin/id-requests/${r.id}/status`, { method: "PUT", body: JSON.stringify({ status: next }) });
      await reload();
    }, next === "ready" ? `${r.full_name}: printed. They are being emailed that the card is ready.` : `${r.full_name}: ${STATUS_LABEL[next] || next}.`);

  // Marks every ticked card as printed. Each person is emailed that their card is ready for pickup.
  const markPrinted = async () => {
    const ids = toPrint.map((r) => r.id);
    const ok = await run(async () => {
      const result = await adminFetch("/admin/id-requests/status", { method: "POST", body: JSON.stringify({ ids, status: "ready" }) });
      setSelected(new Set());
      await reload();
      if (result.noEmail > 0) throw new Error(`Marked as printed, and ${result.emailed} emailed. ${result.noEmail} have no email on file, so tell them to collect their card.`);
    }, `Marked ${ids.length} as printed. They are being emailed that their card is ready.`);
    return ok;
  };

  const [flagOpen, setFlagOpen] = useState(false);
  const [flagReason, setFlagReason] = useState("");
  const flagNow = async () => {
    const ids = ticked.map((r) => r.id);
    const ok = await run(async () => {
      const result = await adminFetch("/admin/id-requests/flag", { method: "POST", body: JSON.stringify({ ids, reason: flagReason.trim() }) });
      setSelected(new Set());
      await reload();
      if (result.noEmail > 0) throw new Error(`Flagged ${result.flagged}. ${result.noEmail} have no email on file, so tell them yourself.`);
    }, `Flagged ${ids.length}. They are being emailed and must pay the new card fee.`);
    if (ok) {
      setFlagOpen(false);
      setFlagReason("");
    }
  };

  const unflag = (r: IdRequest) =>
    run(async () => {
      await adminFetch("/admin/id-requests/unflag", { method: "POST", body: JSON.stringify({ ids: [r.id] }) });
      await reload();
    }, `${r.full_name}: flag removed.`);

  const generate = () =>
    run(async () => {
      const ids = Array.from(new Set(picked.map((r) => r.student_id)));
      const { blob, filename, skippedCount, skippedNames } = await adminDownload("/admin/id-cards/generate", { ids });
      downloadBlob(blob, filename);
      setSelected(new Set());
      await reload();
      if (skippedCount > 0) throw new Error(`Generated, but ${skippedCount} skipped because their ID card fee is unpaid: ${skippedNames}`);
    }, `Generated ${picked.length} card${picked.length === 1 ? "" : "s"}.`);

  return (
    <div className="space-y-5">
      <PageHeader
        title="ID cards"
        description="Tick people, generate their cards (they move to Processing), then mark them Printed to email them."
        actions={
          <>
            <Button className="rounded-full" disabled={busy || picked.length === 0} onClick={generate}>
              <Download className="mr-2 h-4 w-4" />
              Generate cards{picked.length ? ` (${picked.length})` : ""}
            </Button>
            <Button variant="outline" className="rounded-full" disabled={busy || toPrint.length === 0} onClick={markPrinted}>
              <Printer className="mr-2 h-4 w-4" />
              Mark as printed{toPrint.length ? ` (${toPrint.length})` : ""}
            </Button>
            <Button variant="outline" className="rounded-full border-red-300 text-red-700 hover:bg-red-50" disabled={busy || ticked.length === 0} onClick={() => setFlagOpen(true)}>
              <Flag className="mr-2 h-4 w-4" />
              Flag{ticked.length ? ` (${ticked.length})` : ""}
            </Button>
          </>
        }
      />
      <Card>
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search name or matric" />
          <SelectField label="Status" value={status} onChange={setStatus} options={[{ value: "", label: "All statuses" }, ...Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))]} />
          <SelectField label="Level" value={group} onChange={setGroup} options={[{ value: "", label: "All levels" }, { value: "fresher", label: "Freshers" }, { value: "200", label: "200 level" }, { value: "300", label: "300 level" }, { value: "400", label: "400 level" }]} />
          <SelectField label="Department" value={department} onChange={setDepartment} options={[{ value: "", label: "All departments" }, ...departments.map((d) => ({ value: d, label: d }))]} />
        </FilterBar>

        {withoutMatric > 0 && (
          <p className="mt-3 rounded-2xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {withoutMatric} listed request{withoutMatric === 1 ? " cannot" : "s cannot"} have a card generated yet: the ID card fee is unpaid, or there is no matric number (freshers get a card once they update their matric number).
          </p>
        )}

        <div className="mt-4">
          <AsyncBody loading={loading} error={error} empty={rows.length === 0} emptyTitle="No ID card requests" onRetry={reload}>
            <TableWrap>
              <thead>
                <tr>
                  <Th>
                    <input type="checkbox" aria-label="Select all" checked={allSelected} onChange={toggleAll} />
                  </Th>
                  <Th>Name</Th>
                  <Th>Type</Th>
                  <Th>Matric</Th>
                  <Th>Department</Th>
                  <Th>Level</Th>
                  <Th>Fee charged</Th>
                  <Th>Status</Th>
                  <Th>Requested</Th>
                  <Th>Update status</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <Td>
                      <input type="checkbox" aria-label={`Select ${r.full_name}`} disabled={isFlagged(r)} title={isFlagged(r) ? "Flagged: waiting for the new card fee" : ""} checked={selected.has(key(r))} onChange={() => toggle(r)} />
                    </Td>
                    <Td className="font-semibold">{r.full_name}</Td>
                    <Td><Pill tone={r.account_type === "fresher" ? "blue" : "green"}>{r.account_type === "fresher" ? "Fresher" : "Stalite"}</Pill></Td>
                    <Td className="text-xs">{r.matric_number || (r.has_matric ? "-" : "None yet")}</Td>
                    <Td className="text-xs">{r.department || "-"}</Td>
                    <Td>{levelLabel(r.level)}</Td>
                    <Td>{formatNaira(r.fee_amount)}</Td>
                    <Td>
                      <Pill tone={STATUS_TONE[r.status] || "slate"}>{STATUS_LABEL[r.status] || r.status}</Pill>
                      {isFlagged(r) && <div className="mt-1"><Pill tone="red">Flagged</Pill></div>}
                      {!duesOk(r) && <div className="mt-1"><Pill tone="red">Dues unpaid</Pill></div>}
                    </Td>
                    <Td className="text-xs">{formatDate(r.created_at)}</Td>
                    <Td>
                      {isFlagged(r) ? (
                        <div className="space-y-1 text-xs">
                          <p className="max-w-[14rem] text-red-700">{r.flag_reason}</p>
                          <Button size="sm" variant="outline" className="h-7 rounded-full px-3 text-xs" disabled={busy} onClick={() => unflag(r)}>Remove flag</Button>
                        </div>
                      ) : (
                      <SelectField
                        label="Change status"
                        className="h-8 text-xs"
                        value={EDITABLE.includes(r.status) ? r.status : ""}
                        onChange={(v) => v && v !== r.status && setRowStatus(r, v)}
                        options={
                          EDITABLE.includes(r.status)
                            ? EDITABLE.map((s) => ({ value: s, label: STATUS_LABEL[s] }))
                            : [{ value: "", label: "Unpaid" }]
                        }
                      />
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </AsyncBody>
        </div>
      </Card>

      <Dialog open={flagOpen} onOpenChange={(o) => !busy && setFlagOpen(o)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Flag {ticked.length} ID card{ticked.length === 1 ? "" : "s"}</DialogTitle>
            <DialogDescription>
              Each person is emailed, cannot use their portal, and must pay the flagged ID card fee for a new card. Their old card is voided and they can correct their application.
            </DialogDescription>
          </DialogHeader>
          <Textarea className="rounded-2xl" rows={3} maxLength={255} placeholder="Reason (they see this), for example: photo does not follow the ID card rules" value={flagReason} onChange={(e) => setFlagReason(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" className="rounded-full" disabled={busy} onClick={() => setFlagOpen(false)}>Cancel</Button>
            <Button className="rounded-full bg-red-600 hover:bg-red-700" disabled={busy || flagReason.trim().length < 3} onClick={flagNow}>Flag and email</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IdCards;
