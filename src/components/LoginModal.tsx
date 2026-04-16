import { useState } from "react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

const LoginModal = ({ open, onClose }: LoginModalProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [surname, setSurname] = useState("");
  const [matric, setMatric] = useState("");

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!surname.trim() || !matric.trim()) return;
    localStorage.setItem("isLoggedIn", "true");
    toast({ title: "Login successful", description: "Redirecting to your dashboard..." });
    setSurname("");
    setMatric("");
    onClose();
    window.location.href = "/dashboard";
  };


  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
            <LogIn className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">Member Login</h3>
            <p className="text-xs text-muted-foreground">Access your NACOS member portal</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-foreground">Surname</label>
            <Input
              value={surname}
              onChange={(e) => setSurname(e.target.value.toLowerCase())}
              required
              className="mt-1"
              placeholder="Enter surname in lowercase"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">Must be entered in lowercase</p>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground">Matric Number</label>
            <Input
              value={matric}
              onChange={(e) => setMatric(e.target.value)}
              required
              className="mt-1"
              placeholder="e.g. 220401001"
            />
          </div>
          <Button type="submit" className="w-full font-semibold">
            Login
          </Button>
        </form>

        <button
          onClick={onClose}
          className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default LoginModal;
