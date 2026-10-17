import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";

export interface LoginResult {
  token: string;
  user: Record<string, unknown>;
}

interface FresherRegistrationProps {
  onLoggedIn: (data: LoginResult) => void;
  onSwitchToStalite: () => void;
}

type FresherView = "signin" | "register" | "verify" | "forgot" | "reset";

const inputClass = "rounded-xl border-border/50 bg-muted/30 focus:ring-primary/20";

const PasswordField = ({
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete: string;
}) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        autoComplete={autoComplete}
        className={`${inputClass} pr-10`}
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
};

const FresherRegistration = ({ onLoggedIn, onSwitchToStalite }: FresherRegistrationProps) => {
  const { toast } = useToast();
  const [view, setView] = useState<FresherView>("signin");
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const [departments, setDepartments] = useState<string[]>([]);
  const [deptState, setDeptState] = useState<"idle" | "loading" | "failed" | "ready">("idle");

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const loadDepartments = async () => {
    setDeptState("loading");
    try {
      const data = await fetchApi("/content/settings");
      const list: string[] = Array.isArray(data?.departments) ? data.departments : [];
      setDepartments(list);
      setDeptState(list.length > 0 ? "ready" : "failed");
    } catch {
      setDeptState("failed");
    }
  };

  useEffect(() => {
    if (view === "register" && deptState === "idle") loadDepartments();
  }, [view, deptState]);

  const fail = (title: string, error: unknown, fallback: string) => {
    toast({
      title,
      description: error instanceof Error && error.message ? error.message : fallback,
      variant: "destructive",
    });
  };

  const post = (path: string, body: Record<string, string>) =>
    fetchApi(path, { method: "POST", body: JSON.stringify(body) });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    try {
      const data = await post("/fresher/login", { email: email.trim(), password });
      setPassword("");
      onLoggedIn(data as LoginResult);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "";
      if (/stalite|matric/i.test(msg)) {
        toast({ title: "Sign in as a Stalite", description: msg });
        onSwitchToStalite();
      } else if (/verif/i.test(msg)) {
        toast({ title: "Email not verified", description: msg, variant: "destructive" });
        setView("verify");
      } else {
        fail("Login failed", error, "Invalid email or password.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: "Password too short", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Passwords do not match", description: "Re-type your password in both fields.", variant: "destructive" });
      return;
    }
    if (!department) {
      toast({ title: "Choose a department", description: "Select your department to continue.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await post("/fresher/register", {
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        department,
      });
      toast({ title: "Account created", description: "We emailed you a 6-digit code. Check your spam folder too." });
      setOtp("");
      setCooldown(30);
      setView("verify");
    } catch (error) {
      fail("Registration failed", error, "Could not create your account.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    setLoading(true);
    try {
      await post("/fresher/verify", { email: email.trim(), otp });
      toast({ title: "Email verified", description: "Signing you in..." });
      setOtp("");
      if (password) {
        try {
          const data = await post("/fresher/login", { email: email.trim(), password });
          setPassword("");
          setConfirm("");
          onLoggedIn(data as LoginResult);
          return;
        } catch {
          // fall through to the sign-in form
        }
      }
      setPassword("");
      setConfirm("");
      setView("signin");
    } catch (error) {
      fail("Verification failed", error, "Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || !email.trim()) return;
    setLoading(true);
    try {
      await post("/fresher/resend", { email: email.trim() });
      toast({ title: "Code sent", description: "Check your inbox and spam folder." });
      setCooldown(30);
    } catch (error) {
      fail("Could not resend", error, "Try again shortly.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await post("/fresher/forgot-password", { email: email.trim() });
      toast({ title: "Check your email", description: "If the account exists, a reset code is on its way." });
      setOtp("");
      setCooldown(30);
      setView("reset");
    } catch (error) {
      fail("Request failed", error, "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast({ title: "Password too short", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await post("/fresher/reset-password", { email: email.trim(), otp, new_password: newPassword });
      toast({ title: "Password reset", description: "You can now sign in with your new password." });
      setOtp("");
      setNewPassword("");
      setPassword("");
      setView("signin");
    } catch (error) {
      fail("Reset failed", error, "Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  };

  const labelClass = "text-sm font-semibold text-foreground";
  const primaryBtn = "w-full h-12 rounded-xl font-bold";

  const codeInput = (
    <div className="space-y-2">
      <label className={labelClass}>6-Digit Code</label>
      <Input
        placeholder="123456"
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
        required
        inputMode="numeric"
        maxLength={6}
        autoComplete="one-time-code"
        className="rounded-xl border-border/50 bg-muted/30 text-center font-mono text-lg tracking-widest"
      />
      <p className="text-[10px] text-muted-foreground text-center italic">Check your Spam/Junk folder for the code.</p>
    </div>
  );

  const tabs = view === "signin" || view === "register";

  return (
    <div className="space-y-5">
      {tabs && (
        <div className="grid grid-cols-2 gap-1 rounded-full bg-muted/50 p-1">
          {(["signin", "register"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded-full py-2 text-xs font-bold transition-all ${
                view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>
      )}

      {view === "signin" && (
        <form onSubmit={handleSignIn} className="space-y-5">
          <div className="space-y-2">
            <label className={labelClass}>Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className={inputClass}
              placeholder="name@example.com"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className={labelClass}>Password</label>
              <button
                type="button"
                onClick={() => setView("forgot")}
                className="text-[10px] font-bold text-primary hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <PasswordField value={password} onChange={setPassword} placeholder="Enter password" autoComplete="current-password" />
          </div>
          <Button disabled={loading} type="submit" className={primaryBtn}>
            {loading ? "Signing in..." : "Sign In to Portal"}
          </Button>
        </form>
      )}

      {view === "register" && (
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <label className={labelClass}>Full Name</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" className={inputClass} placeholder="Surname first, as on your admission letter" />
          </div>
          <div className="space-y-2">
            <label className={labelClass}>Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className={inputClass} placeholder="name@example.com" />
          </div>
          <div className="space-y-2">
            <label className={labelClass}>Department</label>
            {deptState === "loading" || deptState === "idle" ? (
              <p className="text-xs text-muted-foreground">Loading departments...</p>
            ) : deptState === "failed" ? (
              <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                <span>Could not load departments.</span>
                <button type="button" onClick={loadDepartments} className="font-bold underline">Retry</button>
              </div>
            ) : (
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
                className="flex h-10 w-full rounded-xl border border-border/50 bg-muted/30 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select department</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            )}
          </div>
          <div className="space-y-2">
            <label className={labelClass}>Password</label>
            <PasswordField value={password} onChange={setPassword} placeholder="At least 8 characters" autoComplete="new-password" />
          </div>
          <div className="space-y-2">
            <label className={labelClass}>Confirm Password</label>
            <PasswordField value={confirm} onChange={setConfirm} placeholder="Re-type password" autoComplete="new-password" />
          </div>
          <Button disabled={loading || deptState !== "ready"} type="submit" className={primaryBtn}>
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>
      )}

      {view === "verify" && (
        <form onSubmit={handleVerify} className="space-y-5">
          <p className="text-center text-sm text-muted-foreground">
            Enter the 6-digit code we emailed to <span className="font-semibold text-foreground">{email}</span>.
          </p>
          {codeInput}
          <Button disabled={loading || otp.length !== 6} type="submit" className={primaryBtn}>
            {loading ? "Verifying..." : "Verify Email"}
          </Button>
          <Button type="button" variant="ghost" onClick={handleResend} disabled={loading || cooldown > 0} className="w-full text-xs">
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setView("signin")} className="w-full text-xs">
            Back to sign in
          </Button>
        </form>
      )}

      {view === "forgot" && (
        <form onSubmit={handleForgot} className="space-y-5">
          <div className="space-y-2">
            <label className={labelClass}>Registered Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className={inputClass} placeholder="name@example.com" />
          </div>
          <Button disabled={loading} type="submit" className={primaryBtn}>
            {loading ? "Sending..." : "Get Reset Code"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setView("signin")} className="w-full text-xs">
            Back to Login
          </Button>
        </form>
      )}

      {view === "reset" && (
        <form onSubmit={handleReset} className="space-y-5">
          <p className="text-center text-sm text-muted-foreground">
            Enter the code sent to <span className="font-semibold text-foreground">{email}</span> and choose a new password.
          </p>
          {codeInput}
          <div className="space-y-2">
            <label className={labelClass}>New Password</label>
            <PasswordField value={newPassword} onChange={setNewPassword} placeholder="At least 8 characters" autoComplete="new-password" />
          </div>
          <Button disabled={loading || otp.length !== 6} type="submit" className={primaryBtn}>
            {loading ? "Resetting..." : "Confirm Password Reset"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setView("forgot")} className="w-full text-xs">
            Back
          </Button>
        </form>
      )}
    </div>
  );
};

export default FresherRegistration;
