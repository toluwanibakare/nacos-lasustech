import { useState } from "react";
import { CheckCircle2, Eye, EyeOff, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

export const MIN_PASSWORD = 8;

/** The reason a new password cannot be used yet, or null when it is fine. */
export const passwordProblem = (password: string, confirm: string): string | null => {
  if (password.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters.`;
  if (password !== confirm) return "The two passwords do not match. Retype the same password in both boxes.";
  return null;
};

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  id?: string;
  className?: string;
  label?: string;
}

/** A password box with an eye button to see what you typed. */
export const PasswordInput = ({
  value,
  onChange,
  placeholder,
  autoComplete = "new-password",
  autoFocus,
  id,
  className = "rounded-xl border-border/50 bg-muted/30",
  label = "password",
}: PasswordInputProps) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        required
        className={`${className} pr-11`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? `Hide ${label}` : `Show ${label}`}
        aria-pressed={show}
        className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
};

interface NewPasswordFieldsProps {
  password: string;
  confirm: string;
  onPassword: (value: string) => void;
  onConfirm: (value: string) => void;
  autoFocus?: boolean;
  className?: string;
}

/** New password plus a retype box, each with its own eye button, and a live "match" check. */
export const NewPasswordFields = ({ password, confirm, onPassword, onConfirm, autoFocus, className }: NewPasswordFieldsProps) => {
  const typedConfirm = confirm.length > 0;
  const match = typedConfirm && password === confirm;
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="new-password" className="text-sm font-semibold text-foreground">New Password</label>
        <PasswordInput id="new-password" value={password} onChange={onPassword} placeholder={`At least ${MIN_PASSWORD} characters`} autoFocus={autoFocus} className={className} label="new password" />
      </div>
      <div className="space-y-2">
        <label htmlFor="confirm-password" className="text-sm font-semibold text-foreground">Retype New Password</label>
        <PasswordInput id="confirm-password" value={confirm} onChange={onConfirm} placeholder="Type the same password again" className={className} label="retyped password" />
        <p aria-live="polite" className={`flex items-center gap-1.5 text-[11px] ${!typedConfirm ? "text-muted-foreground" : match ? "text-green-700" : "text-red-600"}`}>
          {!typedConfirm ? (
            `At least ${MIN_PASSWORD} characters. Use the eye button to check what you typed.`
          ) : match ? (
            <><CheckCircle2 className="h-3.5 w-3.5" /> Passwords match</>
          ) : (
            <><XCircle className="h-3.5 w-3.5" /> Passwords do not match yet</>
          )}
        </p>
      </div>
    </div>
  );
};
