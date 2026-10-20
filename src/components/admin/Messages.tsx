import { useMemo, useState } from "react";
import { Lock, Send } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ContactMessage } from "./types";
import { AsyncBody, Card, FilterBar, PageHeader, Pill, SelectField } from "./shared";
import { useAction } from "./useAction";
import { formatDate, useAdminData } from "./utils";

const KIND_LABEL: Record<string, string> = { message: "Message", suggestion: "Suggestion", complaint: "Complaint" };
const KIND_TONE: Record<string, "slate" | "green" | "red" | "amber"> = { message: "slate", suggestion: "green", complaint: "red" };

const truthy = (v: unknown) => v === true || v === 1 || v === "1";
const isAnonymous = (m: ContactMessage) => truthy(m.is_anonymous);

/** Where a reply to this message would go, in words (an anonymous address is never shown). */
const replyTarget = (m: ContactMessage): { canReply: boolean; note: string } => {
  if (!isAnonymous(m)) {
    return m.email ? { canReply: true, note: `Your reply is emailed to ${m.email}.` } : { canReply: false, note: "This message has no email address." };
  }
  return truthy(m.has_reply_email)
    ? { canReply: true, note: "This sender stayed anonymous but left an email. It is stored encrypted, so you cannot see it; your reply is sent to it for you." }
    : { canReply: false, note: "Anonymous with no email left, so there is nowhere to send a reply." };
};

const Messages = () => {
  const { data, loading, error, reload } = useAdminData<ContactMessage[]>("/admin/messages", []);
  const { busy, run } = useAction();
  const [kind, setKind] = useState("");
  const [replying, setReplying] = useState<ContactMessage | null>(null);
  const [draft, setDraft] = useState("");

  const rows = useMemo(() => data.filter((m) => !kind || (m.kind || "message") === kind), [data, kind]);

  const openReply = (m: ContactMessage) => {
    setReplying(m);
    setDraft("");
  };

  const send = async () => {
    if (!replying) return;
    const target = replying;
    const ok = await run(
      () => adminFetch(`/admin/messages/${target.id}/reply`, { method: "POST", body: JSON.stringify({ reply: draft.trim() }) }),
      "Reply sent.",
    );
    if (ok) {
      setReplying(null);
      setDraft("");
      reload();
    }
  };

  const target = replying ? replyTarget(replying) : null;

  return (
    <div className="space-y-5">
      <PageHeader title="Messages" description="The contact form, the suggestion box and the complaint box. Reply from here; anonymous senders who left an email are answered without you ever seeing it." />
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
                const t = replyTarget(m);
                const replies = m.replies || [];
                return (
                  <div key={m.id} className="rounded-2xl bg-[#f7fbf6] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Pill tone={KIND_TONE[k] || "slate"}>{KIND_LABEL[k] || k}</Pill>
                        <p className="font-semibold">{isAnonymous(m) ? "Anonymous" : m.full_name || "Message"}</p>
                        {m.replied_at && <Pill tone="green">Replied</Pill>}
                      </div>
                      <p className="text-xs text-muted-foreground">{formatDate(m.created_at)}</p>
                    </div>
                    {!isAnonymous(m) && m.email && <p className="text-xs text-muted-foreground">{m.email}</p>}
                    {isAnonymous(m) && truthy(m.has_reply_email) && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><Lock className="h-3 w-3" /> Left an email for a reply (stored encrypted)</p>
                    )}
                    {m.subject && <p className="mt-1 text-sm font-medium">{m.subject}</p>}
                    <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{m.message}</p>

                    {replies.length > 0 && (
                      <div className="mt-3 space-y-2 border-l-2 border-primary/30 pl-3">
                        {replies.map((r) => (
                          <div key={r.id}>
                            <p className="whitespace-pre-wrap text-sm text-foreground">{r.reply_text}</p>
                            <p className="text-[11px] text-muted-foreground">Reply by {r.sent_by || "admin"}, {formatDate(r.created_at)}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <Button size="sm" className="h-9 rounded-full px-4" disabled={!t.canReply} onClick={() => openReply(m)}>
                        <Send className="mr-1.5 h-3.5 w-3.5" /> {replies.length ? "Reply again" : "Get response"}
                      </Button>
                      {!t.canReply && <span className="text-xs text-muted-foreground">{t.note}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </AsyncBody>
        </div>
      </Card>

      <Dialog open={!!replying} onOpenChange={(open) => { if (!open && !busy) setReplying(null); }}>
        <DialogContent className="max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle>Reply to {replying ? (isAnonymous(replying) ? "an anonymous " + (KIND_LABEL[replying.kind || "message"] || "message").toLowerCase() : replying.full_name || "this message") : ""}</DialogTitle>
            <DialogDescription>{target?.note}</DialogDescription>
          </DialogHeader>
          {replying && (
            <div className="rounded-2xl bg-muted/50 p-3 text-xs text-muted-foreground">
              <p className="mb-1 font-semibold text-foreground">{KIND_LABEL[replying.kind || "message"]} received</p>
              <p className="max-h-28 overflow-y-auto whitespace-pre-wrap">{replying.message}</p>
            </div>
          )}
          <Textarea
            autoFocus
            rows={6}
            maxLength={5000}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write your reply..."
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] text-muted-foreground">{draft.length} / 5000</span>
            <div className="flex gap-2">
              <Button variant="ghost" className="rounded-full" disabled={busy} onClick={() => setReplying(null)}>Cancel</Button>
              <Button className="rounded-full" disabled={busy || draft.trim().length < 2} onClick={send}>
                <Send className="mr-1.5 h-4 w-4" /> {busy ? "Sending..." : "Send reply"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Messages;
