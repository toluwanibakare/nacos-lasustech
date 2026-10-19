import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, ExternalLink, Info, Loader2, Upload } from "lucide-react";
import Layout from "@/components/Layout";
import LoginModal from "@/components/LoginModal";
import PhotoCropEditor from "@/components/PhotoCropEditor";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL, fetchApi } from "@/lib/api";
import { checkImage, shrinkToLimit } from "@/lib/image-shrink";
import { PhotoCrop, defaultCrop } from "@/lib/photo-crop";

const MAX_BYTES = 2 * 1024 * 1024;
const MIN_SIDE = 300;
const TOKEN_KEY = "signup_token";

interface Settings {
  departments?: string[];
  id_card_stalite?: number | string;
  dues?: number | string;
}

const readToken = () => {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

const naira = (n: number | string | undefined) => `₦${Number(n || 0).toLocaleString()}`;

/**
 * A student with no record registers for the ID card: only what is on the card (name, matric number,
 * level, photo) plus department. They must pay before the account works; after paying they sign in
 * and update their profile like any other student. No email code, no password to invent.
 */
const StaliteRegistration = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const returnedReference = useMemo(() => new URLSearchParams(location.search).get("reference"), [location.search]);

  const [step, setStep] = useState<"details" | "pay" | "done">(returnedReference ? "done" : readToken() ? "pay" : "details");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);

  const [name, setName] = useState("");
  const [matric, setMatric] = useState("");
  const [level, setLevel] = useState("");
  const [department, setDepartment] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [crop, setCrop] = useState<PhotoCrop>(defaultCrop());
  const [saving, setSaving] = useState(false);
  const [paying, setPaying] = useState<null | "id_card" | "bundle">(null);
  const [confirmed, setConfirmed] = useState<null | boolean>(null);

  useEffect(() => {
    fetchApi("/content/settings").then(setSettings).catch(() => setSettings({}));
  }, []);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  // Back from Korapay: confirm the payment (the server also confirms it on its own).
  useEffect(() => {
    if (!returnedReference) return;
    const token = readToken();
    if (!token) { setConfirmed(null); return; }
    fetchApi(`/payments/verify/${encodeURIComponent(returnedReference)}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setConfirmed(r?.data?.status === "success" || r?.status === "success"))
      .catch(() => setConfirmed(false));
  }, [returnedReference]);

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setPreparing(true);
    try {
      const err = await checkImage(f, MIN_SIDE);
      setFileError(err);
      if (err) return toast({ title: "Photo not accepted", description: err, variant: "destructive" });
      const ready = await shrinkToLimit(f, MAX_BYTES, MIN_SIDE);
      if (!ready) {
        const msg = "That photo is too large to use. Try a smaller photo or take a new one.";
        setFileError(msg);
        return toast({ title: "Photo not accepted", description: msg, variant: "destructive" });
      }
      setFile(ready);
      setPreviewUrl(URL.createObjectURL(ready));
      setCrop(defaultCrop());
    } finally {
      setPreparing(false);
    }
  };

  const submit = async () => {
    if (name.trim().length < 3) return toast({ title: "Enter your full name", variant: "destructive" });
    if (matric.trim().length < 6) return toast({ title: "Enter your matric number", variant: "destructive" });
    if (!level) return toast({ title: "Select your level", variant: "destructive" });
    if (!department) return toast({ title: "Select your department", variant: "destructive" });
    if (!file) return toast({ title: "Add your passport photo first", variant: "destructive" });
    if (!acknowledged) return toast({ title: "Tick the guidelines box", description: "Confirm you have read the photo guidelines.", variant: "destructive" });
    setSaving(true);
    try {
      const form = new FormData();
      form.append("full_name", name.trim());
      form.append("matric_number", matric.trim());
      form.append("level", level);
      form.append("department", department);
      form.append("photo_zoom", String(crop.zoom));
      form.append("photo_cx", String(crop.cx));
      form.append("photo_cy", String(crop.cy));
      form.append("image", file);
      const res = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/stalite-signup/register`, { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
      try { sessionStorage.setItem(TOKEN_KEY, data.token); } catch { /* storage unavailable */ }
      setStep("pay");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      toast({ title: "Could not save your registration", description: e instanceof Error ? e.message : "Try again", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const pay = async (type: "id_card" | "bundle") => {
    const token = readToken();
    if (!token) {
      setStep("details");
      return toast({ title: "Please fill in your details again", variant: "destructive" });
    }
    setPaying(type);
    try {
      const data = await fetchApi("/payments/initialize", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ payment_type: type }),
      });
      const url = data?.data?.authorization_url;
      if (!url) throw new Error("No payment link was returned");
      window.location.href = url;
    } catch (e) {
      toast({ title: "Could not start payment", description: e instanceof Error ? e.message : "Try again", variant: "destructive" });
      setPaying(null);
    }
  };

  const fee = Number(settings?.id_card_stalite || 0);
  const dues = Number(settings?.dues || 0);
  const imageSrc = previewUrl;

  return (
    <Layout>
      <section className="py-12 md:py-16">
        <div className="container max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">ID card</span>
          <h1 className="mt-2 font-display text-3xl font-bold text-foreground">Register for your ID card</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            For students who have no NACOS record yet. Fill in what appears on your card and pay the ID card fee. Your account is activated
            when you pay, then you can sign in and update your profile like every other student.
          </p>

          <ol className="mt-6 flex gap-2 text-xs font-semibold">
            {[["details", "1. Your details"], ["pay", "2. Pay"], ["done", "3. Sign in"]].map(([k, label]) => (
              <li key={k} className={`rounded-full px-3 py-1 ${step === k ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{label}</li>
            ))}
          </ol>

          {step === "details" && (
            <div className="mt-8 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="reg-name">Full name</Label>
                  <Input id="reg-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="As it should appear on your card" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-matric">Matric number</Label>
                  <Input id="reg-matric" value={matric} onChange={(e) => setMatric(e.target.value)} placeholder="e.g. 230303010052" />
                </div>
                <div className="space-y-1.5">
                  <Label>Level</Label>
                  <Select value={level} onValueChange={setLevel}>
                    <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                    <SelectContent>
                      {["200", "300", "400"].map((l) => <SelectItem key={l} value={l}>{l} Level</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Department</Label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger><SelectValue placeholder={settings === null ? "Loading..." : "Select department"} /></SelectTrigger>
                    <SelectContent>
                      {(settings?.departments || []).map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-2xl border bg-muted/30 p-4 text-sm">
                <p className="mb-2 font-medium">Photo guidelines</p>
                <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                  <li>Face the camera, passport style.</li>
                  <li>No glasses, hats or blur, and no side view.</li>
                  <li>
                    A transparent background is compulsory. Remove your background free at{" "}
                    <a href="https://remove.bg" target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 font-medium text-green-700 underline">
                      remove.bg <ExternalLink className="h-3 w-3" />
                    </a>
                    .
                  </li>
                  <li>JPG, PNG or WEBP. Large photos are reduced automatically.</li>
                </ul>
                <div className="mt-3 flex items-center gap-2">
                  <Checkbox id="reg-ack" checked={acknowledged} onCheckedChange={(v) => setAcknowledged(v === true)} />
                  <Label htmlFor="reg-ack" className="cursor-pointer text-sm">I have read the guidelines and my photo meets them.</Label>
                </div>
              </div>

              <div className="space-y-2">
                <div className="relative inline-block">
                  <Button type="button" variant="outline" tabIndex={-1} aria-hidden="true" className="pointer-events-none h-11 rounded-full px-5">
                    {preparing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    {preparing ? "Preparing photo..." : imageSrc ? "Change photo" : "Choose photo"}
                  </Button>
                  {acknowledged ? (
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      aria-label="Choose photo"
                      onChange={onPickFile}
                      disabled={preparing}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  ) : (
                    <button
                      type="button"
                      aria-label="Choose photo"
                      className="absolute inset-0 h-full w-full cursor-pointer rounded-full"
                      onClick={() => toast({ title: "Tick the box first", description: "Confirm you have read the photo guidelines, then choose your photo.", variant: "destructive" })}
                    />
                  )}
                </div>
                {!acknowledged && <p className="text-xs text-muted-foreground">Tick the box above first, then choose your photo.</p>}
                {fileError && <p className="text-sm text-destructive">{fileError}</p>}
              </div>

              {imageSrc && <PhotoCropEditor src={imageSrc} crop={crop} onChange={setCrop} name={name.trim() || "Your Name"} level={level} post="Student" matric={matric.trim() || null} />}

              <Button className="h-12 w-full rounded-full text-sm font-bold" onClick={submit} disabled={saving || preparing}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Continue to payment
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Already have an account?{" "}
                <button type="button" className="font-semibold text-primary hover:underline" onClick={() => setLoginOpen(true)}>Sign in</button>
              </p>
            </div>
          )}

          {step === "pay" && (
            <div className="mt-8 space-y-5">
              <div className="flex gap-2 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> Your details are saved. Pay to activate your account.
              </div>
              <div className="rounded-3xl border border-border bg-card p-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">ID card fee</p>
                <p className="mt-1 font-display text-3xl font-bold text-foreground">{settings ? naira(fee) : "..."}</p>
                <Button className="mt-5 h-12 w-full rounded-full text-sm font-bold" onClick={() => pay("id_card")} disabled={!!paying || !settings || !fee}>
                  {paying === "id_card" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Pay ID card {settings ? naira(fee) : ""}
                </Button>
                {dues > 0 && (
                  <>
                    <Button variant="outline" className="mt-3 h-12 w-full rounded-full text-sm font-bold" onClick={() => pay("bundle")} disabled={!!paying || !settings || !fee}>
                      {paying === "bundle" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Pay dues and ID card {naira(fee + dues)}
                    </Button>
                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                      Dues and the ID card go together: your card is printed and your receipt is released once both are paid. You can pay dues later from your dashboard.
                    </p>
                  </>
                )}
                <p className="mt-4 text-center text-[10px] text-muted-foreground">Powered by <strong>Korapay</strong>. The payer covers the small payment charge.</p>
              </div>
              <button type="button" className="text-xs font-semibold text-muted-foreground hover:underline" onClick={() => { try { sessionStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } setStep("details"); }}>
                Change my details
              </button>
            </div>
          )}

          {step === "done" && (
            <div className="mt-8 space-y-5">
              {confirmed === false ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
                  <p className="font-bold">We could not confirm your payment yet.</p>
                  <p className="mt-1">If you were debited, your account is activated automatically within a few minutes. Try signing in shortly, and contact the admin if it does not work.</p>
                </div>
              ) : (
                <div className="rounded-3xl border border-green-200 bg-green-50/60 p-6">
                  <p className="flex items-center gap-2 text-base font-bold text-green-800"><CheckCircle2 className="h-5 w-5" /> {confirmed === null && !readToken() ? "Payment received" : "Payment confirmed"}</p>
                  <p className="mt-2 text-sm leading-relaxed text-green-900">Your account is ready. Sign in with your matric number. Your first password is your first name in lowercase.</p>
                  <div className="mt-4 flex gap-2 rounded-2xl bg-white/70 p-3 text-xs text-green-900">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" /> After you sign in, you will be asked to update your profile (email, WhatsApp number and a new password), like every other student.
                  </div>
                </div>
              )}
              <Button className="h-12 w-full rounded-full text-sm font-bold" onClick={() => setLoginOpen(true)}>Sign in</Button>
              <Button variant="ghost" className="w-full rounded-full text-xs" onClick={() => { try { sessionStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } navigate("/"); }}>Back to the website</Button>
            </div>
          )}
        </div>
      </section>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <span className="sr-only"><Link to="/">Home</Link></span>
    </Layout>
  );
};

export default StaliteRegistration;
