import { useState } from "react";
import { LogIn, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { fetchApi } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  redirectTab?: string;
}

const LoginModal = ({ open, onClose, redirectTab }: LoginModalProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [view, setView] = useState<"login" | "forgot" | "reset">("login");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [matric, setMatric] = useState("");
  const [forgotMatric, setForgotMatric] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || !matric.trim()) return;
    setLoading(true);

    try {
      const data = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          matric_number: matric,
          password: password,
        }),
      });

      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      toast({ title: "Login successful", description: "Welcome back to the portal!" });
      setPassword("");
      setMatric("");
      onClose();
      
      if (redirectTab) {
        navigate("/dashboard", { state: { tab: redirectTab } });
      } else {
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({ 
        title: "Login failed", 
        description: "Login credentials invalid or server error.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotMatric.trim() || !forgotEmail.trim()) return;
    setLoading(true);

    try {
      const data = await fetchApi('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ 
          matric_number: forgotMatric,
          email: forgotEmail
        }),
      });
      toast({ title: "Email Sent", description: "Please check your inbox and spam folder for the code." });
      setView("reset");
    } catch (error: any) {
      toast({ 
        title: "Request failed", 
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetchApi('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ 
          matric_number: forgotMatric, 
          otp, 
          new_password: newPassword 
        }),
      });
      toast({ title: "Success", description: "Password reset successfully! You can now login." });
      setView("login");
      setOtp("");
      setNewPassword("");
    } catch (error: any) {
      toast({ 
        title: "Reset failed", 
        description: error.message || "Invalid OTP or error resetting password.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) {
        onClose();
        setView("login");
      }
    }}>
      <DialogContent className="sm:max-w-[400px] border-border/50 shadow-2xl">
        <DialogHeader className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <LogIn className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="font-display text-2xl font-bold">
            {view === "login" ? "Member Login" : "Reset Password"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {view === "login" 
              ? "Access your NACOS LASUSTECH member portal." 
              : "Enter your details to receive a password reset link."}
          </DialogDescription>
        </DialogHeader>

        {view === "login" ? (
          <form onSubmit={handleSubmit} className="mt-4 space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-foreground">Matric Number</label>
                <button 
                  type="button"
                  onClick={() => setView("forgot")}
                  className="text-[10px] font-bold text-primary hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <Input
                value={matric}
                onChange={(e) => setMatric(e.target.value)}
                required
                className="rounded-xl border-border/50 bg-muted/30 focus:ring-primary/20"
                placeholder="e.g. 230303010052"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="rounded-xl border-border/50 bg-muted/30 focus:ring-primary/20 pr-10"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground ml-1">Default password is your surname in lowercase</p>
            </div>
            
            <Button disabled={loading} type="submit" className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">
              {loading ? "Signing in..." : "Sign In to Portal"}
            </Button>
          </form>
        ) : view === "forgot" ? (
          <form onSubmit={handleForgotPassword} className="mt-4 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Matric Number</label>
              <Input
                value={forgotMatric}
                onChange={(e) => setForgotMatric(e.target.value)}
                required
                className="rounded-xl border-border/50 bg-muted/30"
                placeholder="e.g. 230303010052"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Registered Email</label>
              <Input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
                className="rounded-xl border-border/50 bg-muted/30"
                placeholder="e.g. name@example.com"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl font-bold" 
              disabled={loading}
            >
              {loading ? "Sending OTP..." : "Get Reset Code"}
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setView("login")}
              className="w-full text-xs"
            >
              Back to Login
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="mt-4 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">6-Digit OTP</label>
              <Input
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength={6}
                className="rounded-xl border-border/50 bg-muted/30 text-center font-mono text-lg tracking-widest"
              />
              <p className="text-[10px] text-muted-foreground text-center italic mt-1">
                Check your **Spam/Junk** folder for the code.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">New Password</label>
              <Input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="rounded-xl border-border/50 bg-muted/30"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl font-bold" 
              disabled={loading}
            >
              {loading ? "Resetting..." : "Confirm Password Reset"}
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setView("forgot")}
              className="w-full text-xs"
            >
              Back to Verification
            </Button>
          </form>
        )}

        <div className="mt-4 text-center">
          <button
            onClick={onClose}
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
          >
            Go Back
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
