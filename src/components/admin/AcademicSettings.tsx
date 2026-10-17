import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { adminFetch } from "@/lib/admin-api";
import { AcademicSettings as Academic, FeeSettings } from "./types";
import { Card, ErrorState, Field, PageHeader, SelectField, Spinner } from "./shared";
import { useAction } from "./useAction";
import { formatNaira, useAdminData } from "./utils";

const SESSION_RE = /^(\d{4})\/(\d{4})$/;

const AcademicSettings = () => {
  const academic = useAdminData<Academic | null>("/admin/settings/academic", null);
  const fees = useAdminData<FeeSettings | null>("/admin/settings/fees", null);
  const { busy, run } = useAction();

  const [session, setSession] = useState("");
  const [semester, setSemester] = useState("First Semester");
  const [welcome, setWelcome] = useState("");
  const [stalite, setStalite] = useState("");
  const [fresher, setFresher] = useState("");
  const [dues, setDues] = useState("");
  const [academicSaved, setAcademicSaved] = useState(false);
  const [feesSaved, setFeesSaved] = useState(false);
  const [academicErr, setAcademicErr] = useState<string | null>(null);
  const [feesErr, setFeesErr] = useState<string | null>(null);

  useEffect(() => {
    if (academic.data) {
      setSession(academic.data.session || "");
      setSemester(academic.data.semester || "First Semester");
      setWelcome(academic.data.welcomeMessage || "");
    }
  }, [academic.data]);

  useEffect(() => {
    if (fees.data) {
      setStalite(String(fees.data.idCardStalite ?? ""));
      setFresher(String(fees.data.idCardFresher ?? ""));
      setDues(String(fees.data.dues ?? ""));
    }
  }, [fees.data]);

  const saveAcademic = async () => {
    const m = SESSION_RE.exec(session.trim());
    if (!m || Number(m[2]) !== Number(m[1]) + 1) {
      setAcademicErr("Session must look like 2026/2027 (consecutive years).");
      return;
    }
    setAcademicErr(null);
    const ok = await run(
      () => adminFetch("/admin/settings/academic", { method: "PUT", body: JSON.stringify({ session: session.trim(), semester, welcomeMessage: welcome }) }),
      "Academic settings saved.",
    );
    setAcademicSaved(ok);
    if (ok) academic.reload();
  };

  const saveFees = async () => {
    const values = { idCardStalite: stalite, idCardFresher: fresher, dues };
    const parsed: Record<string, number> = {};
    for (const [k, v] of Object.entries(values)) {
      const n = Number(v);
      if (v.trim() === "" || !Number.isFinite(n) || n < 0) {
        setFeesErr("Enter a valid amount (0 or more) for every fee.");
        return;
      }
      parsed[k] = n;
    }
    setFeesErr(null);
    const ok = await run(() => adminFetch("/admin/settings/fees", { method: "PUT", body: JSON.stringify(parsed) }), "Fees saved.");
    setFeesSaved(ok);
    if (ok) fees.reload();
  };

  if ((academic.loading && !academic.data) || (fees.loading && !fees.data)) return <Spinner />;
  if (academic.error) return <ErrorState message={academic.error} onRetry={academic.reload} />;
  if (fees.error) return <ErrorState message={fees.error} onRetry={fees.reload} />;

  const Saved = ({ show }: { show: boolean }) =>
    show ? (
      <span className="inline-flex items-center gap-1 text-sm text-emerald-700">
        <Check className="h-4 w-4" /> Saved
      </span>
    ) : null;

  return (
    <div className="space-y-5">
      <PageHeader title="Academic and fees" description="The session, semester and fees students see." />
      <Card title="Academic session">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Session" hint="Format 2026/2027">
            <Input className="rounded-full" value={session} onChange={(e) => { setSession(e.target.value); setAcademicSaved(false); }} placeholder="2026/2027" />
          </Field>
          <Field label="Semester">
            <SelectField className="w-full" value={semester} onChange={(v) => { setSemester(v); setAcademicSaved(false); }} options={[{ value: "First Semester", label: "First Semester" }, { value: "Second Semester", label: "Second Semester" }]} />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Welcome message" hint="Shown on student dashboards.">
            <Textarea rows={4} value={welcome} onChange={(e) => { setWelcome(e.target.value); setAcademicSaved(false); }} />
          </Field>
        </div>
        {academicErr && <p className="mt-3 text-sm text-red-700">{academicErr}</p>}
        <div className="mt-4 flex items-center gap-3">
          <Button className="rounded-full" disabled={busy} onClick={saveAcademic}>Save academic settings</Button>
          <Saved show={academicSaved} />
        </div>
      </Card>

      <Card title="Fees" description={`Amounts in naira. Dues apply to session ${fees.data?.session || session}.`}>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="ID card (stalites)" hint={formatNaira(Number(stalite))}>
            <Input className="rounded-full" inputMode="numeric" value={stalite} onChange={(e) => { setStalite(e.target.value); setFeesSaved(false); }} />
          </Field>
          <Field label="ID card (freshers)" hint={formatNaira(Number(fresher))}>
            <Input className="rounded-full" inputMode="numeric" value={fresher} onChange={(e) => { setFresher(e.target.value); setFeesSaved(false); }} />
          </Field>
          <Field label="Dues" hint={formatNaira(Number(dues))}>
            <Input className="rounded-full" inputMode="numeric" value={dues} onChange={(e) => { setDues(e.target.value); setFeesSaved(false); }} />
          </Field>
        </div>
        {feesErr && <p className="mt-3 text-sm text-red-700">{feesErr}</p>}
        <div className="mt-4 flex items-center gap-3">
          <Button className="rounded-full" disabled={busy} onClick={saveFees}>Save fees</Button>
          <Saved show={feesSaved} />
        </div>
      </Card>
    </div>
  );
};

export default AcademicSettings;
