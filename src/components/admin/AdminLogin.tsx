import { useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { loginToAdminSystems } from "@/lib/admin-api";
import logo from "@/assets/nacos_logo.png";
import { errMessage } from "./utils";

export interface AdminUser {
  name?: string;
  username?: string;
  role?: string;
  super?: boolean;
  permissions?: string[];
}

export const AdminLogin = ({ onSignedIn }: { onSignedIn: (user: AdminUser) => void }) => {
  const { toast } = useToast();
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await loginToAdminSystems(credentials.username, credentials.password);
      toast({ title: "Signed in", description: "Welcome to the NACOS admin." });
      onSignedIn(res.user);
    } catch (err) {
      toast({ title: "Login failed", description: errMessage(err), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[linear-gradient(135deg,#062018_0%,#0f3b2c_55%,#133321_100%)]">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="grid w-full max-w-4xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-white">
            <img src={logo} alt="NACOS" className="h-12 w-12 rounded-full bg-white object-contain p-1" />
            <p className="mt-6 text-xs uppercase tracking-[0.35em] text-white/60">NACOS LASUSTECH</p>
            <h1 className="mt-3 text-3xl font-bold">Chapter admin</h1>
            <p className="mt-3 max-w-md text-sm leading-7 text-white/70">
              Sign in to manage students, freshers, ID cards, payments, fees, emails, executives, events and blogs.
            </p>
          </div>
          <form onSubmit={submit} className="rounded-[2rem] bg-white p-8">
            <div className="flex items-center gap-3 text-[#0f3b2c]">
              <ShieldCheck className="h-6 w-6" />
              <p className="text-sm font-bold uppercase tracking-[0.25em]">Admin login</p>
            </div>
            <div className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">Username or matric number</label>
                <Input className="rounded-full" value={credentials.username} onChange={(e) => setCredentials({ ...credentials, username: e.target.value })} required autoComplete="username" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">Password</label>
                <div className="relative">
                  <Input className="rounded-full pr-10" type={show ? "text" : "password"} value={credentials.password} onChange={(e) => setCredentials({ ...credentials, password: e.target.value })} required autoComplete="current-password" />
                  <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground">
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full rounded-full bg-[#0f3b2c] hover:bg-[#062018]" disabled={busy}>
                {busy ? "Signing in..." : "Sign in"}
              </Button>
            </div>
          </form>
        </div>
      </div>
      <footer className="px-4 py-4 text-center text-xs text-white/50">&copy; {new Date().getFullYear()} NACOS LASUSTECH. All rights reserved.</footer>
    </div>
  );
};
