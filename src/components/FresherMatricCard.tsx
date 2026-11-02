import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";

/**
 * A fresher adds the matric number they were given. They become a student of the level they registered for
 * (100, or 200 for direct entry) and then sign in as a Stalite with that matric number and the same password.
 */
const FresherMatricCard = ({ level }: { level: string }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [matric, setMatric] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<{ matric: string; level: string } | null>(null);
  const levelLabel = level === "200" ? "200 level (direct entry)" : "100 level";

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = matric.trim().toUpperCase();
    if (value.length < 6) {
      toast({ title: "Check your matric number", description: "Type the matric number exactly as it was given to you.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const data = await fetchApi("/fresher/matric", { method: "POST", body: JSON.stringify({ matric_no: value }) });
      setDone({ matric: String(data?.matric_no || value), level: String(data?.level || level) });
    } catch (error) {
      toast({
        title: "Could not save your matric number",
        description: error instanceof Error && error.message ? error.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const signInAgain = () => {
    localStorage.clear();
    toast({ title: "Sign in as a Stalite", description: "Use your matric number and the same password you have been using." });
    navigate("/");
  };

  if (done) {
    return (
      <div className="flex flex-col gap-3 rounded-3xl border border-green-200 bg-green-50 p-5 md:p-6">
        <div className="flex items-center gap-3 text-green-900">
          <CheckCircle2 className="h-6 w-6 shrink-0" />
          <h3 className="text-sm font-bold">Matric number saved: {done.matric}</h3>
        </div>
        <p className="text-xs leading-relaxed text-green-900">
          You are now a {done.level === "200" ? "200 level (direct entry)" : "100 level"} student. Sign in again as a Stalite with your matric number and the same password.
        </p>
        <Button className="w-fit rounded-full" onClick={signInAgain}>Sign in as a Stalite</Button>
      </div>
    );
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4 rounded-3xl border border-primary/20 bg-primary/5 p-5 md:p-6">
      <div>
        <h3 className="text-sm font-bold text-foreground">Update your matric number</h3>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          Now that you have a matric number, add it here. You will be moved to your {levelLabel} class as a full student and can get your ID card.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={matric}
          onChange={(e) => setMatric(e.target.value)}
          placeholder="Matric number"
          autoComplete="off"
          className="rounded-full sm:max-w-xs"
        />
        <Button type="submit" className="rounded-full" disabled={saving || !matric.trim()}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save matric number
        </Button>
      </div>
    </form>
  );
};

export default FresherMatricCard;
