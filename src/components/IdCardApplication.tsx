import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, ExternalLink, Info, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL, fetchApi } from "@/lib/api";
import PhotoCropEditor from "@/components/PhotoCropEditor";
import { PhotoCrop, defaultCrop } from "@/lib/photo-crop";
import { shrinkToLimit } from "@/lib/image-shrink";

interface IdCardRequest {
  id: number;
  status: "awaiting_payment" | "pending" | "processing" | "ready" | "collected";
  fee_amount: number;
  blood_group: string | null;
  birthday: string | null;
  emergency_contact: string | null;
}

interface IdCardStatus {
  status: string;
  request: IdCardRequest | null;
  fee: number;
  photo: { image_path: string | null; zoom: number | null; cx: number | null; cy: number | null } | null;
  card_issuable: boolean;
  card_note: string | null;
  editable?: boolean;
  dues_exempt?: boolean;
  dues_cleared?: boolean;
  dues_fee?: number;
}

interface StoredUser {
  name?: string;
  matric?: string | null;
  account_type?: "student" | "fresher";
  level?: string;
  post?: string;
}

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const MAX_BYTES = 2 * 1024 * 1024;
const MIN_SIDE = 300;
const STATUS_LABELS: Record<string, string> = {
  awaiting_payment: "Awaiting payment",
  pending: "Paid, waiting to be processed",
  processing: "Being processed",
  ready: "Ready for collection",
  collected: "Collected",
};

const photoUrl = (path: string) =>
  `https://nacosid.tmb.it.com/${path.startsWith("uploads/") ? path : `uploads/${path}`}`;

const readUser = (): StoredUser => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}") || {};
  } catch {
    return {};
  }
};

const checkImage = (file: File): Promise<string | null> =>
  new Promise((resolve) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return resolve("Photo must be a JPG, PNG or WEBP image.");
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(
        Math.min(img.naturalWidth, img.naturalHeight) < MIN_SIDE
          ? `Photo is too small. The shorter side must be at least ${MIN_SIDE}px.`
          : null,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve("That file could not be read as an image.");
    };
    img.src = url;
  });

const saveApplication = async (form: FormData) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/services/id-card/application`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
};

const IdCardApplication = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<StoredUser>(readUser);
  const [status, setStatus] = useState<IdCardStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const [acknowledged, setAcknowledged] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [crop, setCrop] = useState<PhotoCrop>(defaultCrop());
  const [bloodGroup, setBloodGroup] = useState("");
  const [birthday, setBirthday] = useState("");
  const [emergency, setEmergency] = useState("");
  const [saving, setSaving] = useState(false);
  const [paying, setPaying] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const isFresher = user.account_type === "fresher";

  const applyStatus = useCallback((s: IdCardStatus) => {
    setStatus(s);
    const p = s.photo;
    if (p && p.zoom != null && p.cx != null && p.cy != null) {
      setCrop({ zoom: Number(p.zoom), cx: Number(p.cx), cy: Number(p.cy) });
    } else {
      setCrop(defaultCrop());
    }
    if (s.request) {
      setBloodGroup(s.request.blood_group || "");
      setBirthday(s.request.birthday ? s.request.birthday.slice(0, 10) : "");
      setEmergency(s.request.emergency_contact || "");
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const s: IdCardStatus = await fetchApi("/services/id-card/status");
      applyStatus(s);
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Could not load your ID card status");
    } finally {
      setLoading(false);
    }
  }, [applyStatus]);

  useEffect(() => {
    load();
    // Students: the stored user lacks level, so read it from the dashboard profile.
    const u = readUser();
    if (u.account_type !== "fresher") {
      fetchApi("/student/dashboard")
        .then((d) => {
          const p = d?.profile || {};
          setUser((prev) => ({
            ...prev,
            name: p.full_name || prev.name,
            level: p.level || prev.level,
            post: p.post || prev.post,
            matric: p.matric_no || prev.matric,
          }));
        })
        .catch(() => undefined);
    }
  }, [load]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const savedUrl = useMemo(
    () => (status?.photo?.image_path ? photoUrl(status.photo.image_path) : null),
    [status],
  );
  const imageSrc = previewUrl || savedUrl;

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const err = await checkImage(f);
    setFileError(err);
    if (err) {
      toast({ title: "Photo not accepted", description: err, variant: "destructive" });
      return;
    }
    const ready = await shrinkToLimit(f, MAX_BYTES, MIN_SIDE);
    if (!ready) {
      const msg = "That photo is too large to use. Try a smaller photo or take a new one.";
      setFileError(msg);
      toast({ title: "Photo not accepted", description: msg, variant: "destructive" });
      return;
    }
    if (ready !== f) toast({ title: "Photo resized", description: "Your photo was larger than 2MB, so it was reduced to fit." });
    setFile(ready);
    setPreviewUrl(URL.createObjectURL(ready));
    setCrop(defaultCrop());
  };

  const nameProps = {
    name: user.name || "Your Name",
    level: user.level || (isFresher ? "100" : ""),
    post: isFresher ? "Fresher" : user.post || "Student",
    matric: isFresher ? null : user.matric || null,
  };

  const onSave = async () => {
    if (!imageSrc) return toast({ title: "Add a photo first", variant: "destructive" });
    if (!acknowledged) return toast({ title: "Tick the guidelines box", description: "Confirm you have read the photo guidelines, then save.", variant: "destructive" });
    if (!bloodGroup || !birthday) return toast({ title: "Choose a blood group and enter your birthday", variant: "destructive" });
    if (!/^0\d{10}$/.test(emergency)) {
      return toast({ title: "Enter a valid 11-digit Nigerian phone number for your emergency contact", variant: "destructive" });
    }
    setSaving(true);
    try {
      const form = new FormData();
      if (file) form.append("image", file);
      form.append("photo_zoom", String(crop.zoom));
      form.append("photo_cx", String(crop.cx));
      form.append("photo_cy", String(crop.cy));
      form.append("blood_group", bloodGroup);
      form.append("birthday", birthday);
      form.append("emergency_contact", emergency);
      await saveApplication(form);
      setFile(null);
      setPreviewUrl(null);
      setEditing(false);
      await load();
      toast({ title: "Application saved", description: "You can now pay for your ID card." });
    } catch (e) {
      toast({ title: "Could not save application", description: e instanceof Error ? e.message : "Try again", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const onPay = async (type: "id_card" | "bundle" = "id_card") => {
    setPaying(true);
    try {
      const data = await fetchApi("/payments/initialize", {
        method: "POST",
        body: JSON.stringify({ payment_type: type }),
      });
      const url = data?.data?.authorization_url;
      if (!url) throw new Error("No payment link was returned");
      window.location.href = url;
    } catch (e) {
      toast({ title: "Could not start payment", description: e instanceof Error ? e.message : "Try again", variant: "destructive" });
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading your ID card...
      </div>
    );
  }
  if (loadError || !status) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <AlertCircle className="mx-auto mb-2 h-6 w-6 text-destructive" />
        <p className="text-sm">{loadError || "Could not load your ID card status"}</p>
        <Button variant="outline" className="mt-3 rounded-full" onClick={() => { setLoading(true); load(); }}>Retry</Button>
      </div>
    );
  }

  const req = status.request;
  const paid = !!req && req.status !== "awaiting_payment";
  // An application can be changed until the card has been generated.
  const editable = status.editable !== false;
  const canEdit = !req || req.status === "awaiting_payment" || (editable && editing);
  const duesOwed = !status.dues_cleared && !status.dues_exempt;

  // (a) read-only summary
  if (paid && req && !canEdit) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold">Your ID card</h2>
          <Badge className="rounded-full">{STATUS_LABELS[req.status] || req.status}</Badge>
        </div>
        {status.card_note && (
          <div className="flex gap-2 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            <Info className="mt-0.5 h-4 w-4 shrink-0" /> {status.card_note}
          </div>
        )}
        {savedUrl && (
          <PhotoCropEditor readOnly src={savedUrl} crop={crop} onChange={setCrop} {...nameProps} />
        )}
        <dl className="mx-auto grid max-w-sm grid-cols-2 gap-2 text-sm">
          <dt className="text-muted-foreground">Blood group</dt><dd>{req.blood_group || "-"}</dd>
          <dt className="text-muted-foreground">Birthday</dt><dd>{req.birthday ? req.birthday.slice(0, 10) : "-"}</dd>
          <dt className="text-muted-foreground">Emergency contact</dt><dd>{req.emergency_contact || "-"}</dd>
          <dt className="text-muted-foreground">Fee paid</dt><dd>₦{Number(req.fee_amount).toLocaleString()}</dd>
        </dl>
        {duesOwed && (
          <div className="flex gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <Info className="mt-0.5 h-4 w-4 shrink-0" /> Your dues are not paid yet. Dues and the ID card go together, so your card is printed once your dues are paid. Pay them in the Dues &amp; Fees tab.
          </div>
        )}
        {editable ? (
          <div className="text-center">
            <Button variant="outline" className="rounded-full" onClick={() => setEditing(true)}>
              Edit photo and details
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">You can change your photo and details until your card is generated.</p>
          </div>
        ) : (
          <p className="text-center text-xs text-muted-foreground">Your card has been generated, so it can no longer be changed.</p>
        )}
      </div>
    );
  }

  // (b) form
  const hasSaved = !!req;
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{paid ? "Edit your ID card application" : "Apply for your ID card"}</h2>

      {isFresher && (
        <div className="flex gap-2 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          You can pay and arrange your photo now. Your card is printed after your matric number is assigned.
        </div>
      )}

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
          <li>JPG, PNG or WEBP, up to 2MB, at least {MIN_SIDE}px on the shorter side.</li>
          <li>If the upload fails, contact your HOC or an Excos member.</li>
        </ul>
        <div className="mt-3 flex items-center gap-2">
          <Checkbox id="ack" checked={acknowledged} onCheckedChange={(v) => setAcknowledged(v === true)} />
          <Label htmlFor="ack" className="cursor-pointer text-sm">I have read the guidelines and my photo meets them.</Label>
        </div>
      </div>

      <div className="space-y-2">
        <input id="id-photo-input" ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={onPickFile} />
        <Button asChild variant="outline" className="h-11 cursor-pointer rounded-full px-5">
          <label htmlFor="id-photo-input">
            <Upload className="mr-2 h-4 w-4" /> {imageSrc ? "Change photo" : "Choose photo"}
          </label>
        </Button>
        {fileError && <p className="text-sm text-destructive">{fileError}</p>}
      </div>

      {imageSrc && <PhotoCropEditor src={imageSrc} crop={crop} onChange={setCrop} {...nameProps} />}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Blood group</Label>
          <Select value={bloodGroup} onValueChange={setBloodGroup}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {BLOOD_GROUPS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bday">Birthday</Label>
          <Input id="bday" type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="emerg">Emergency contact</Label>
          <Input id="emerg" type="tel" inputMode="numeric" maxLength={11} placeholder="08012345678" value={emergency} onChange={(e) => setEmergency(e.target.value.replace(/\D/g, ""))} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button className="rounded-full" onClick={onSave} disabled={saving || paying}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save application
        </Button>
        {paid && (
          <Button variant="ghost" className="rounded-full" onClick={() => setEditing(false)} disabled={saving}>Cancel</Button>
        )}
      </div>

      {hasSaved && req?.status === "awaiting_payment" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2 text-sm text-green-900">
            <CheckCircle2 className="h-4 w-4" /> Application saved. Pay the ID card fee to continue.
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant={duesOwed ? "outline" : "default"} className="rounded-full" onClick={() => onPay("id_card")} disabled={paying || saving}>
              {paying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Pay ID card ₦{Number(status.fee).toLocaleString()}
            </Button>
            {duesOwed && (
              <Button className="rounded-full" onClick={() => onPay("bundle")} disabled={paying || saving}>
                Pay dues and ID card ₦{(Number(status.fee) + Number(status.dues_fee || 0)).toLocaleString()}
              </Button>
            )}
          </div>
        </div>
      )}
      {hasSaved && req?.status === "awaiting_payment" && duesOwed && (
        <p className="text-xs text-muted-foreground">Dues and the ID card go together. You can pay them separately, but your card is printed and your receipts are released once both are paid.</p>
      )}
      {!hasSaved && (
        <p className="text-sm text-muted-foreground">
          Fee: ₦{Number(status.fee).toLocaleString()}. Save your application to unlock payment.
        </p>
      )}
    </div>
  );
};

export default IdCardApplication;
