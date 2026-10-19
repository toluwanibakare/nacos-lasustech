import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/api";
import { money } from "@/lib/receipt";

interface Verified {
  valid: boolean;
  message?: string;
  receipt_no?: string;
  name?: string;
  matric?: string | null;
  account_type?: string;
  session?: string | null;
  date?: string | null;
  items?: { label: string; amount: number }[];
  total?: number;
}

const formatDate = (iso?: string | null) => {
  if (!iso) return "-";
  const d = new Date(iso.replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? String(iso) : d.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
};

const VerifyReceipt = () => {
  const { code = "" } = useParams();
  const [result, setResult] = useState<Verified | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchApi(`/payments/verify-receipt/${encodeURIComponent(code)}`, { headers: { Authorization: "" } })
      .then((r) => { if (!cancelled) setResult(r); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [code]);

  return (
    <Layout>
      <section className="py-14 md:py-20">
        <div className="container max-w-xl">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Receipt check</span>
          <h1 className="mt-2 font-display text-3xl font-bold text-foreground">Verify a NACOS receipt</h1>

          {!result && !failed && (
            <p className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Checking this receipt...
            </p>
          )}

          {failed && (
            <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
              We could not check this receipt right now. Please try again in a moment.
            </div>
          )}

          {result && !result.valid && (
            <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6">
              <p className="flex items-center gap-2 text-base font-bold text-red-800"><ShieldAlert className="h-5 w-5" /> Not verified</p>
              <p className="mt-2 text-sm text-red-900">{result.message || "This receipt could not be verified."}</p>
              <p className="mt-3 text-xs text-red-800/80">Do not accept this receipt. Ask the holder to download it again from their NACOS dashboard.</p>
            </div>
          )}

          {result?.valid && (
            <div className="mt-8 rounded-3xl border border-green-200 bg-green-50/60 p-6">
              <p className="flex items-center gap-2 text-base font-bold text-green-800"><CheckCircle2 className="h-5 w-5" /> Genuine NACOS LASUSTECH receipt</p>
              <p className="mt-1 text-xs text-green-900/80">This matches a completed payment in the NACOS records.</p>
              <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Receipt no</dt><dd className="text-right font-semibold">{result.receipt_no}</dd>
                <dt className="text-muted-foreground">Paid by</dt><dd className="text-right font-semibold">{result.name}</dd>
                <dt className="text-muted-foreground">{result.account_type === "fresher" ? "Account" : "Matric no"}</dt>
                <dd className="text-right font-semibold">{result.account_type === "fresher" ? "Fresher" : result.matric || "-"}</dd>
                <dt className="text-muted-foreground">Session</dt><dd className="text-right font-semibold">{result.session || "-"}</dd>
                <dt className="text-muted-foreground">Date</dt><dd className="text-right font-semibold">{formatDate(result.date)}</dd>
              </dl>
              <div className="mt-5 border-t border-green-200 pt-4 text-sm">
                {result.items?.map((i) => (
                  <div key={i.label} className="flex justify-between py-0.5"><span>{i.label}</span><span className="font-semibold">{money(i.amount)}</span></div>
                ))}
                <div className="mt-2 flex justify-between border-t border-green-200 pt-2 text-base font-bold text-green-800">
                  <span>Total paid</span><span>{money(result.total || 0)}</span>
                </div>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">Check that the name and amounts match the printed receipt.</p>
            </div>
          )}

          <Button asChild variant="outline" className="mt-8 rounded-full">
            <Link to="/">Back to the NACOS website</Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default VerifyReceipt;
