import { useMemo, useState } from "react";
import { ContactMessage } from "./types";
import { AsyncBody, Card, FilterBar, PageHeader, Pill, SelectField } from "./shared";
import { formatDate, useAdminData } from "./utils";

const KIND_LABEL: Record<string, string> = { message: "Message", suggestion: "Suggestion", complaint: "Complaint" };
const KIND_TONE: Record<string, "slate" | "green" | "red" | "amber"> = { message: "slate", suggestion: "green", complaint: "red" };

const isAnonymous = (m: ContactMessage) => m.is_anonymous === true || Number(m.is_anonymous) === 1;

const Messages = () => {
  const { data, loading, error, reload } = useAdminData<ContactMessage[]>("/admin/messages", []);
  const [kind, setKind] = useState("");

  const rows = useMemo(() => data.filter((m) => !kind || (m.kind || "message") === kind), [data, kind]);

  return (
    <div className="space-y-5">
      <PageHeader title="Messages" description="The contact form, the suggestion box and the complaint box. Anonymous notes have no name or email." />
      <Card>
        <FilterBar>
          <SelectField
            label="Type"
            value={kind}
            onChange={setKind}
            options={[{ value: "", label: "All" }, ...Object.entries(KIND_LABEL).map(([value, label]) => ({ value, label }))]}
          />
        </FilterBar>
        <div className="mt-4">
          <AsyncBody loading={loading} error={error} empty={rows.length === 0} emptyTitle="Nothing here yet" onRetry={reload}>
            <div className="space-y-3">
              {rows.map((m) => {
                const k = m.kind || "message";
                return (
                  <div key={m.id} className="rounded-2xl bg-[#f7fbf6] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Pill tone={KIND_TONE[k] || "slate"}>{KIND_LABEL[k] || k}</Pill>
                        <p className="font-semibold">{isAnonymous(m) ? "Anonymous" : m.full_name || "Message"}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{formatDate(m.created_at)}</p>
                    </div>
                    {!isAnonymous(m) && m.email && <p className="text-xs text-muted-foreground">{m.email}</p>}
                    {m.subject && <p className="mt-1 text-sm font-medium">{m.subject}</p>}
                    <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{m.message}</p>
                  </div>
                );
              })}
            </div>
          </AsyncBody>
        </div>
      </Card>
    </div>
  );
};

export default Messages;
