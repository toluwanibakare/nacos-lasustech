import { useEffect, useState } from "react";
import { Check, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { adminFetch } from "@/lib/admin-api";
import { Card, ErrorState, Field, PageHeader, Spinner } from "./shared";
import { useAction } from "./useAction";
import { useAdminData } from "./utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Person { full_name: string; level: string; whatsapp_number: string | null; birthday: string; day: number; days_until: number }

// Nigerian numbers are stored as 0803... or 234803...; wa.me wants the country code and no symbols.
const whatsappLink = (number: string | null, name: string) => {
  let digits = (number || "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("0")) digits = "234" + digits.slice(1);
  const first = name.trim().split(/\s+/)[0];
  return `https://wa.me/${digits}?text=${encodeURIComponent(`Happy birthday ${first}! 🎂 From all of us at NACOS LASUSTECH.`)}`;
};

const PersonList = ({ title, people, empty }: { title: string; people: Person[]; empty: string }) => (
  <Card title={`${title} (${people.length})`}>
    {people.length === 0 ? (
      <p className="text-sm text-muted-foreground">{empty}</p>
    ) : (
      <ul className="divide-y">
        {people.map((p) => {
          const link = whatsappLink(p.whatsapp_number, p.full_name);
          return (
            <li key={`${p.full_name}-${p.birthday}`} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{p.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  {p.level} | {new Date(p.birthday).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}
                  {p.days_until === 0 ? " | Today" : p.days_until === 1 ? " | Tomorrow" : ""}
                </p>
              </div>
              {link ? (
                <Button asChild size="sm" variant="outline" className="shrink-0 rounded-full">
                  <a href={link} target="_blank" rel="noopener noreferrer"><MessageCircle className="mr-1.5 h-4 w-4" />WhatsApp</a>
                </Button>
              ) : (
                <span className="shrink-0 text-xs text-muted-foreground">No number</span>
              )}
            </li>
          );
        })}
      </ul>
    )}
  </Card>
);

const Birthdays = () => {
  const list = useAdminData<{ month: string; people: Person[] } | null>("/admin/birthdays/list", null);
  const settings = useAdminData<{ recipients: string[] } | null>("/admin/birthdays", null);
  const { busy, run } = useAction();
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (settings.data) setText((settings.data.recipients || []).join("\n"));
  }, [settings.data]);

  const save = async () => {
    const recipients = text.split(/[\s,;]+/).map((e) => e.trim()).filter(Boolean);
    const bad = recipients.find((e) => !EMAIL_RE.test(e));
    if (bad) {
      setErr(`"${bad}" is not a valid email address.`);
      return;
    }
    setErr(null);
    const ok = await run(() => adminFetch("/admin/birthdays", { method: "PUT", body: JSON.stringify({ recipients }) }), "Birthday emails saved.");
    setSaved(ok);
    if (ok) settings.reload();
  };

  if ((settings.loading && !settings.data) || (list.loading && !list.data)) return <Spinner />;
  if (settings.error) return <ErrorState message={settings.error} onRetry={settings.reload} />;
  if (list.error) return <ErrorState message={list.error} onRetry={list.reload} />;

  const people = list.data?.people || [];
  const today = people.filter((p) => p.days_until === 0);
  const week = people.filter((p) => p.days_until > 0 && p.days_until < 7);
  const later = people.filter((p) => p.days_until >= 7);

  const count = text.split(/[\s,;]+/).filter(Boolean).length;

  return (
    <div className="space-y-5">
      <PageHeader title="Birthdays" description="Who is celebrating, and who gets the reminder emails." />
      <PersonList title="Today" people={today} empty="No birthdays today." />
      <PersonList title="This week" people={week} empty="No more birthdays in the next 6 days." />
      <PersonList title={`Later in ${list.data?.month || "the month"}`} people={later} empty="No other birthdays this month." />
      <Card title="Reminder emails">
        <Field label="Email addresses" hint="One per line. Only these addresses get birthday emails. Leave empty to send none.">
          <Textarea rows={4} value={text} onChange={(e) => { setText(e.target.value); setSaved(false); }} placeholder="name@example.com" />
        </Field>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>The day before a birthday: two emails, one in the morning (7:00) and one at night (20:00).</li>
          <li>On the birthday: one email, in the morning (7:00). Nothing after that.</li>
          <li>Times are Lagos time.</li>
        </ul>
        {count === 0 && <p className="mt-3 text-sm text-amber-700">No address is set, so no birthday emails are being sent.</p>}
        {err && <p className="mt-3 text-sm text-red-700">{err}</p>}
        <div className="mt-4 flex items-center gap-3">
          <Button className="rounded-full" disabled={busy} onClick={save}>Save</Button>
          {saved && (
            <span className="inline-flex items-center gap-1 text-sm text-emerald-700">
              <Check className="h-4 w-4" /> Saved
            </span>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Birthdays;
