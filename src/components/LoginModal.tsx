import { useState } from "react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
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
}

const LoginModal = ({ open, onClose }: LoginModalProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [surname, setSurname] = useState("");
  const [matric, setMatric] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!surname.trim() || !matric.trim()) return;

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matric_number: matric,
          password: surname, // Assuming surname is used as password for now as per current UI
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        toast({ title: "Login successful", description: "Welcome back to the portal!" });
        setSurname("");
        setMatric("");
        onClose();
        navigate("/dashboard");
      } else {
        toast({ 
          title: "Login failed", 
          description: data.message || "Invalid credentials",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({ 
        title: "Connection Error", 
        description: "Could not connect to the backend server. Is it running?",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[400px] border-border/50 shadow-2xl">
        <DialogHeader className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <LogIn className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="font-display text-2xl font-bold">Member Login</DialogTitle>
          <DialogDescription className="text-sm">
            Access your NACOS LASUSTECH member portal.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Surname</label>
            <Input
              value={surname}
              onChange={(e) => setSurname(e.target.value.toLowerCase())}
              required
              className="rounded-xl border-border/50 bg-muted/30 focus:ring-primary/20"
              placeholder="Enter surname (lowercase)"
            />
            <p className="text-[10px] text-muted-foreground ml-1">Must be entered in lowercase</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Matric Number</label>
            <Input
              value={matric}
              onChange={(e) => setMatric(e.target.value)}
              required
              className="rounded-xl border-border/50 bg-muted/30 focus:ring-primary/20"
              placeholder="e.g. 230303010052"
            />
          </div>
          <Button type="submit" className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">
            Sign In to Portal
          </Button>
        </form>

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
