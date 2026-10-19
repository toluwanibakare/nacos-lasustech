import { useState } from "react";
import { EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";

export type FeedbackKind = "message" | "suggestion" | "complaint";

const KINDS: { id: FeedbackKind; label: string; prompt: string }[] = [
  { id: "message", label: "Message", prompt: "How can we help?" },
  { id: "suggestion", label: "Suggestion", prompt: "What should NACOS LASUSTECH start, stop or improve?" },
  { id: "complaint", label: "Complaint", prompt: "What went wrong? Tell us what happened." },
];

interface Props {
  defaultKind?: FeedbackKind;
  /** Pre-fill and lock the sender when a signed-in member uses the box inside the dashboard. */
  className?: string;
}

const FeedbackForm = ({ defaultKind = "message", className = "" }: Props) => {
  const { toast } = useToast();
  const [kind, setKind] = useState<FeedbackKind>(defaultKind);
  const [anonymous, setAnonymous] = useState(defaultKind !== "message");
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [busy, setBusy] = useState(false);
  const current = KINDS.find((k) => k.id === kind)!;

  const pick = (next: FeedbackKind) => {
    setKind(next);
    setAnonymous(next !== "message");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await fetchApi("/contact/submit", {
        method: "POST",
        // An anonymous note must not carry the member's sign-in token.
        headers: anonymous ? { Authorization: "" } : undefined,
        body: JSON.stringify({
          kind,
          is_anonymous: anonymous,
          full_name: anonymous ? "" : form.name,
          email: anonymous ? "" : form.email,
          subject: `${current.label} from the website`,
          message: form.message,
        }),
      });
      toast({
        title: "Sent",
        description: anonymous
          ? result?.message || "Thank you. Your note was sent without your name."
          : `${result?.message || "Thank you."} Please check your inbox and spam folder for a confirmation.`,
      });
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      toast({
        title: "Not sent",
        description: err instanceof Error && err.message ? err.message : "Failed to send. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <div role="tablist" aria-label="What are you sending?" className="flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            role="tab"
            aria-selected={kind === k.id}
            onClick={() => pick(k.id)}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
              kind === k.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            {k.label}
          </button>
        ))}
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-muted/40 p-3">
        <Switch checked={anonymous} onCheckedChange={setAnonymous} aria-label="Send anonymously" className="mt-0.5" />
        <span className="text-xs leading-5 text-muted-foreground">
          <span className="flex items-center gap-1.5 font-semibold text-foreground">
            <EyeOff className="h-3.5 w-3.5" /> Send anonymously
          </span>
          {anonymous
            ? "Your name, email and account are not sent or saved with this. We cannot reply to you."
            : "Turn on to hide who you are. Otherwise we will see your name and email and can reply."}
        </span>
      </label>

      {!anonymous && (
        <>
          <div>
            <label className="text-xs font-medium text-foreground">Full Name</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="mt-1" placeholder="Your full name" />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground">Email Address</label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="mt-1" placeholder="you@example.com" />
          </div>
        </>
      )}

      <div>
        <label className="text-xs font-medium text-foreground">{current.label}</label>
        <Textarea
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          required
          minLength={5}
          maxLength={3000}
          className="mt-1 min-h-[120px]"
          placeholder={current.prompt}
        />
        <p className="mt-1 text-right text-[10px] text-muted-foreground">{form.message.length} / 3000</p>
      </div>

      <Button type="submit" disabled={busy} className="w-full rounded-full font-semibold">
        {busy ? "Sending..." : `Send ${current.label}`}
      </Button>
    </form>
  );
};

export default FeedbackForm;
