import { useMemo } from "react";
import { AdminDashboard, Fresher, IdRequest, Payment } from "./types";
import { Card, ErrorState, PageHeader, Pill, Spinner, StatCard, TableWrap, Td, Th } from "./shared";
import { formatDate, formatNaira, isSuccess, LEVELS, levelLabel, useAdminData } from "./utils";
import { PAYMENT_TYPE_LABEL } from "./Payments";

const Overview = () => {
  const dash = useAdminData<AdminDashboard | null>("/admin/dashboard", null);
  const freshers = useAdminData<Fresher[]>("/admin/freshers", []);
  const ids = useAdminData<IdRequest[]>("/admin/id-requests", []);
  const pays = useAdminData<Payment[]>("/admin/payments", []);

  const students = dash.data?.students || [];
  const successful = useMemo(() => pays.data.filter((p) => isSuccess(p.status)), [pays.data]);
  const revenue = successful.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const pendingCards = ids.data.filter((r) => r.status === "pending" || r.status === "processing").length;
  const alumni = students.filter((s) => s.level === "alumni").length;

  const departments = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => s.department && set.add(s.department));
    return Array.from(set).sort();
  }, [students]);

  const count = (level: string, dept: string) => students.filter((s) => s.level === level && s.department === dept).length;

  if (dash.loading && !dash.data) return <Spinner label="Loading overview..." />;
  if (dash.error) return <ErrorState message={dash.error} onRetry={dash.reload} />;

  const recent = successful.slice(0, 8);

  return (
    <div className="space-y-5">
      <PageHeader title="Overview" description="Snapshot of the chapter right now." />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total students" value={dash.data?.stats?.totalStudents ?? students.length} />
        <StatCard label="Freshers" value={freshers.loading ? "..." : freshers.data.length} hint={freshers.error || undefined} />
        <StatCard label="Alumni" value={alumni} />
        <StatCard label="Pending ID cards" value={ids.loading ? "..." : pendingCards} hint={ids.error || "Pending or processing"} />
        <StatCard label="Revenue" value={pays.loading ? "..." : formatNaira(revenue)} hint={pays.error || `${successful.length} successful payments`} />
        <StatCard label="Session" value={dash.data?.stats?.currentSession || "Not set"} hint={dash.data?.stats?.currentSemester || undefined} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card title="Recent payments" description="Successful payments only.">
          {pays.error ? (
            <ErrorState message={pays.error} onRetry={pays.reload} />
          ) : pays.loading ? (
            <Spinner />
          ) : recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No successful payments yet.</p>
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Who</Th>
                  <Th>Type</Th>
                  <Th>Amount</Th>
                  <Th>Date</Th>
                </tr>
              </thead>
              <tbody>
                {recent.map((p) => (
                  <tr key={p.id}>
                    <Td>{p.full_name || p.matric_no || "-"}</Td>
                    <Td><Pill tone="green">{PAYMENT_TYPE_LABEL[p.payment_type] || p.payment_type}</Pill></Td>
                    <Td>{formatNaira(p.amount)}</Td>
                    <Td className="text-xs">{formatDate(p.created_at)}</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Card>

        <Card title="Headcount" description="Students by level and department.">
          {departments.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No department data yet.</p>
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Level</Th>
                  {departments.map((d) => (
                    <Th key={d}>{d}</Th>
                  ))}
                  <Th>Total</Th>
                </tr>
              </thead>
              <tbody>
                {[...LEVELS, "alumni"].map((level) => (
                  <tr key={level}>
                    <Td className="font-semibold">{levelLabel(level)}</Td>
                    {departments.map((d) => (
                      <Td key={d}>{count(level, d)}</Td>
                    ))}
                    <Td className="font-semibold">{students.filter((s) => s.level === level).length}</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Overview;
