import { ContactMessage } from "./types";
import { AsyncBody, Card, PageHeader } from "./shared";
import { formatDate, useAdminData } from "./utils";

const Messages = () => {
  const { data, loading, error, reload } = useAdminData<ContactMessage[]>("/admin/messages", []);
  return (
    <div className="space-y-5">
      <PageHeader title="Messages" description="Messages sent through the website contact form." />
      <Card>
        <AsyncBody loading={loading} error={error} empty={data.length === 0} emptyTitle="No messages yet" onRetry={reload}>
          <div className="space-y-3">
            {data.map((m) => (
              <div key={m.id} className="rounded-2xl bg-[#f7fbf6] p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold">{m.full_name || "Message"}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(m.created_at)}</p>
                </div>
                {m.email && <p className="text-xs text-muted-foreground">{m.email}</p>}
                {m.subject && <p className="mt-1 text-sm font-medium">{m.subject}</p>}
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{m.message}</p>
              </div>
            ))}
          </div>
        </AsyncBody>
      </Card>
    </div>
  );
};

export default Messages;
