import { useEffect, useMemo, useState } from "react";
import { Loader2, MailCheck, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { adminFetch } from "@/lib/admin-api";
import { Audience, AudienceCounts, AudienceType, Campaign, FeeSettings } from "./types";
import { AsyncBody, Card, ConfirmDialog, Field, PageHeader, Pill, SelectField, TableWrap, Td, Th } from "./shared";
import { errMessage, formatDate, LEVELS, levelLabel, useAdminData } from "./utils";

const AUDIENCES: { value: AudienceType; label: string }[] = [
  { value: "all", label: "Everyone" },
  { value: "alumni", label: "Alumni" },
  { value: "fresher", label: "Freshers only" },
  { value: "stalite", label: "Stalites only" },
  { value: "level", label: "By level" },
  { value: "department", label: "By department" },
  { value: "level_department", label: "Level + department" },
];

const audienceText = (type: string, level?: string | null, dept?: string | null) => {
  const base = AUDIENCES.find((a) => a.value === type)?.label || type;
  const extra = [level ? levelLabel(level) : "", dept || ""].filter(Boolean).join(", ");
  return extra ? `${base} (${extra})` : base;
};

interface EmailCheck {
  ok: boolean;
  host: string;
  port: number;
  from: string | null;
  error?: string;
}

const EmailManager = () => {
  const { toast } = useToast();
  const [checking, setChecking] = useState(false);
  const [check, setCheck] = useState<EmailCheck | null>(null);

  // Asks the server to connect to its mail provider, so a wrong password or a blocked port shows up here
  // instead of as a failed code on a student's phone.
  const testConnection = async () => {
    setChecking(true);
    try {
      const result: EmailCheck = await adminFetch("/admin/email-check");
      setCheck(result);
      toast({
        title: result.ok ? "Email is working" : "Email is not working",
        description: result.ok ? `Connected to ${result.host}.` : result.error,
        variant: result.ok ? undefined : "destructive",
      });
    } catch (err) {
      toast({ title: "Could not run the check", description: errMessage(err), variant: "destructive" });
    } finally {
      setChecking(false);
    }
  };
  const history = useAdminData<Campaign[]>("/admin/email/campaigns", []);
  const fees = useAdminData<FeeSettings | null>("/admin/settings/fees", null);
  const departments = fees.data?.departments || [];

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<AudienceType>("all");
  const [level, setLevel] = useState("100");
  const [department, setDepartment] = useState("");
  const [counts, setCounts] = useState<AudienceCounts | null>(null);
  const [countsError, setCountsError] = useState<string | null>(null);
  const [countsLoading, setCountsLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const needsLevel = type === "level" || type === "level_department";
  const needsDept = type === "department" || type === "level_department";
  const audience: Audience | null = useMemo(() => {
    if (needsDept && !department) return null;
    return { type, ...(needsLevel ? { level } : {}), ...(needsDept ? { department } : {}) };
  }, [type, level, department, needsLevel, needsDept]);

  useEffect(() => {
    if (!audience) {
      setCounts(null);
      return;
    }
    let cancelled = false;
    setCountsLoading(true);
    setCountsError(null);
    adminFetch("/admin/email/audience-counts", { method: "POST", body: JSON.stringify({ audience }) })
      .then((res: AudienceCounts) => !cancelled && setCounts(res))
      .catch((err) => !cancelled && (setCounts(null), setCountsError(errMessage(err))))
      .finally(() => !cancelled && setCountsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [audience]);

  const canSend = !!audience && subject.trim() && body.trim() && counts && counts.with_email > 0 && !sending;

  const send = async () => {
    if (!audience || !counts) return;
    setSending(true);
    setWarning(null);
    setProgress({ sent: 0, failed: 0, total: counts.with_email });
    try {
      const created = await adminFetch("/admin/email/campaigns", {
        method: "POST",
        body: JSON.stringify({ subject: subject.trim(), body, audience }),
      });
      if (created.warning) setWarning(created.warning);
      let total = Number(created.with_email ?? counts.with_email);
      setProgress({ sent: 0, failed: 0, total });
      let done = false;
      let last = { sent: 0, failed: 0 };
      while (!done) {
        const res = await adminFetch(`/admin/email/campaigns/${created.id}/send-batch`, { method: "POST" });
        done = Boolean(res.done);
        total = Number(res.campaign?.with_email ?? total);
        last = { sent: Number(res.campaign?.sent_count || 0), failed: Number(res.campaign?.failed_count || 0) };
        setProgress({ ...last, total });
      }
      toast({ title: "Campaign finished", description: `${last.sent} sent, ${last.failed} failed.` });
      setSubject("");
      setBody("");
    } catch (err) {
      toast({ title: "Sending stopped", description: errMessage(err), variant: "destructive" });
    } finally {
      setSending(false);
      history.reload();
    }
  };

  const pct = progress && progress.total > 0 ? Math.min(100, Math.round(((progress.sent + progress.failed) / progress.total) * 100)) : 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Email"
        description="Send announcements to students. Only people with an email on record receive them."
        actions={
          <Button variant="outline" className="rounded-full" onClick={testConnection} disabled={checking}>
            {checking ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <MailCheck className="mr-1.5 h-4 w-4" />}
            Test email connection
          </Button>
        }
      />
      {check && (
        <div className={`rounded-2xl border p-4 text-sm ${check.ok ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-900"}`}>
          <p className="font-semibold">{check.ok ? "The mail server accepted our connection and login." : "The mail server could not be used."}</p>
          <p className="mt-1 break-words text-xs">
            Server {check.host}, port {check.port}{check.from ? `, sending as ${check.from}` : ""}.{check.error ? ` ${check.error}` : ""}
          </p>
        </div>
      )}
      <Card title="Compose">
        <div className="space-y-4">
          <Field label="Subject">
            <Input className="rounded-full" value={subject} onChange={(e) => setSubject(e.target.value)} disabled={sending} />
          </Field>
          <Field label="Message" hint="Plain text (blank line = new paragraph) or HTML. Use {{name}} to insert the first name.">
            <Textarea rows={8} value={body} onChange={(e) => setBody(e.target.value)} disabled={sending} placeholder="Hello {{name}}, ..." />
          </Field>

          <div className="flex flex-wrap items-end gap-3">
            <Field label="Audience">
              <SelectField value={type} onChange={(v) => setType(v as AudienceType)} options={AUDIENCES} />
            </Field>
            {needsLevel && (
              <Field label="Level">
                <SelectField value={level} onChange={setLevel} options={LEVELS.map((l) => ({ value: l, label: levelLabel(l) }))} />
              </Field>
            )}
            {needsDept && (
              <Field label="Department">
                <SelectField value={department} onChange={setDepartment} options={[{ value: "", label: "Select department" }, ...departments.map((d) => ({ value: d, label: d }))]} />
              </Field>
            )}
          </div>

          <div className="rounded-2xl bg-[#f7fbf6] p-4 text-sm">
            {!audience ? (
              <p className="text-muted-foreground">Choose a department to see who matches.</p>
            ) : countsLoading ? (
              <p className="text-muted-foreground">Counting...</p>
            ) : countsError ? (
              <p className="text-red-700">{countsError}</p>
            ) : counts ? (
              <>
                <p className="font-semibold">
                  {counts.total.toLocaleString()} people match, {counts.with_email.toLocaleString()} have an email on record.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Only the {counts.with_email.toLocaleString()} with an email will receive this message
                  {counts.total > counts.with_email ? `; ${(counts.total - counts.with_email).toLocaleString()} will be skipped.` : "."}
                </p>
              </>
            ) : null}
          </div>

          {warning && <p className="rounded-2xl bg-amber-50 px-3 py-2 text-sm text-amber-900">{warning}</p>}

          {progress && (
            <div className="space-y-2">
              <Progress value={pct} />
              <p className="text-xs text-muted-foreground">
                Sent {progress.sent} - Failed {progress.failed} - Total {progress.total}
                {sending ? " (keep this page open)" : ""}
              </p>
            </div>
          )}

          <Button className="rounded-full" disabled={!canSend} onClick={() => setConfirmOpen(true)}>
            <Send className="mr-2 h-4 w-4" />
            {sending ? "Sending..." : "Send"}
          </Button>
        </div>
      </Card>

      <Card title="Campaign history">
        <AsyncBody loading={history.loading} error={history.error} empty={history.data.length === 0} emptyTitle="No campaigns yet" onRetry={history.reload}>
          <TableWrap>
            <thead>
              <tr>
                <Th>Subject</Th>
                <Th>Audience</Th>
                <Th>Matched</Th>
                <Th>With email</Th>
                <Th>Sent</Th>
                <Th>Failed</Th>
                <Th>Status</Th>
                <Th>Date</Th>
              </tr>
            </thead>
            <tbody>
              {history.data.map((c) => (
                <tr key={c.id}>
                  <Td className="max-w-[220px] truncate font-semibold">{c.subject}</Td>
                  <Td className="text-xs">{audienceText(c.audience_type, c.audience_level, c.audience_department)}</Td>
                  <Td>{c.total_students}</Td>
                  <Td>{c.with_email}</Td>
                  <Td>{c.sent_count}</Td>
                  <Td>{c.failed_count}</Td>
                  <Td><Pill tone={c.status === "sent" || c.status === "completed" ? "green" : c.status === "failed" ? "red" : "amber"}>{c.status}</Pill></Td>
                  <Td className="text-xs">{formatDate(c.sent_at || c.created_at)}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </AsyncBody>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Send ${counts?.with_email.toLocaleString() ?? 0} emails?`}
        confirmLabel="Send now"
        description={`"${subject}" will be emailed to ${counts?.with_email.toLocaleString() ?? 0} people (${counts?.total.toLocaleString() ?? 0} matched, the rest have no email on record). This cannot be undone.`}
        onConfirm={send}
      />
    </div>
  );
};

export default EmailManager;
