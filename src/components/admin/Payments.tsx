import { useMemo, useState } from "react";
import { Payment } from "./types";
import { AsyncBody, Card, FilterBar, PageHeader, Pill, SearchInput, SelectField, StatCard, TableWrap, Td, Th } from "./shared";
import HocMaterials from "./HocMaterials";
import { formatDate, formatNaira, isSuccess, useAdminData, useDebouncedValue } from "./utils";

export const PAYMENT_TYPE_LABEL: Record<string, string> = {
  dues: "Dues",
  id_card: "ID card",
  hoc_item: "HOC item",
  id_replacement: "ID replacement",
};

const statusTone = (s: string) => (isSuccess(s) ? "green" : s === "pending" ? "amber" : "red");

const Payments = () => {
  const { data, loading, error, reload } = useAdminData<Payment[]>("/admin/payments", []);
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [session, setSession] = useState("");
  const [search, setSearch] = useState("");
  const q = useDebouncedValue(search.trim().toLowerCase());

  const sessions = useMemo(() => Array.from(new Set(data.map((p) => p.session).filter(Boolean) as string[])).sort().reverse(), [data]);

  const rows = useMemo(
    () =>
      data.filter((p) => {
        if (status && p.status !== status) return false;
        if (type && p.payment_type !== type) return false;
        if (session && p.session !== session) return false;
        return !q || `${p.full_name || ""} ${p.matric_no || ""} ${p.reference}`.toLowerCase().includes(q);
      }),
    [data, status, type, session, q],
  );

  const successful = rows.filter((p) => isSuccess(p.status));
  const total = successful.reduce((s, p) => s + Number(p.amount || 0), 0);

  const materials = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    successful
      .filter((p) => p.payment_type === "hoc_item")
      .forEach((p) => {
        const k = p.item_title || "Untitled item";
        const cur = map.get(k) || { count: 0, total: 0 };
        map.set(k, { count: cur.count + 1, total: cur.total + Number(p.amount || 0) });
      });
    return Array.from(map.entries()).sort((a, b) => b[1].total - a[1].total);
  }, [successful]);

  return (
    <div className="space-y-5">
      <PageHeader title="Payments" description="Totals count successful payments only." />
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Successful total" value={formatNaira(total)} hint="For the current filters" />
        <StatCard label="Successful payments" value={successful.length} />
        <StatCard label="Rows shown" value={rows.length} hint={`of ${data.length}`} />
      </div>

      <Card>
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search name, matric or reference" />
          <SelectField label="Status" value={status} onChange={setStatus} options={[{ value: "", label: "All statuses" }, { value: "success", label: "Success" }, { value: "pending", label: "Pending" }, { value: "failed", label: "Failed" }]} />
          <SelectField label="Type" value={type} onChange={setType} options={[{ value: "", label: "All types" }, ...Object.entries(PAYMENT_TYPE_LABEL).map(([value, label]) => ({ value, label }))]} />
          <SelectField label="Session" value={session} onChange={setSession} options={[{ value: "", label: "All sessions" }, ...sessions.map((s) => ({ value: s, label: s }))]} />
        </FilterBar>
        <div className="mt-4">
          <AsyncBody loading={loading} error={error} empty={rows.length === 0} emptyTitle="No payments match" onRetry={reload}>
            <div className="max-h-[560px] overflow-y-auto">
              <TableWrap>
                <thead>
                  <tr>
                    <Th>Who</Th>
                    <Th>Type</Th>
                    <Th>Amount</Th>
                    <Th>Status</Th>
                    <Th>Session</Th>
                    <Th>Reference</Th>
                    <Th>Date</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id}>
                      <Td>
                        <p className="font-semibold">{p.full_name || "-"}</p>
                        <p className="text-xs text-muted-foreground">{p.matric_no || (p.account_type === "fresher" ? "Fresher" : "")}</p>
                      </Td>
                      <Td>
                        {PAYMENT_TYPE_LABEL[p.payment_type] || p.payment_type}
                        {p.item_title && <p className="text-xs text-muted-foreground">{p.item_title}</p>}
                      </Td>
                      <Td>{formatNaira(p.amount)}</Td>
                      <Td><Pill tone={statusTone(p.status)}>{p.status}</Pill></Td>
                      <Td className="text-xs">{p.session || "-"}</Td>
                      <Td className="text-xs">{p.reference}</Td>
                      <Td className="text-xs">{formatDate(p.created_at)}</Td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            </div>
          </AsyncBody>
        </div>
      </Card>

      <Card title="Course materials" description="Successful HOC item payments grouped by item, for the current filters.">
        {materials.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No successful course material payments.</p>
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Item</Th>
                <Th>Buyers</Th>
                <Th>Revenue</Th>
              </tr>
            </thead>
            <tbody>
              {materials.map(([title, m]) => (
                <tr key={title}>
                  <Td className="font-semibold">{title}</Td>
                  <Td>{m.count}</Td>
                  <Td>{formatNaira(m.total)}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>

      <HocMaterials />
    </div>
  );
};

export default Payments;
