import { ReactNode } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, Inbox, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export const PageHeader = ({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 className="text-2xl font-bold text-[#062018]">{title}</h1>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
);

export const Card = ({ title, description, actions, children, className }: { title?: string; description?: string; actions?: ReactNode; children: ReactNode; className?: string }) => (
  <section className={cn("rounded-3xl border border-[#0f3b2c]/10 bg-white p-5", className)}>
    {(title || actions) && (
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          {title && <h2 className="text-base font-bold text-[#062018]">{title}</h2>}
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </div>
    )}
    {children}
  </section>
);

export const StatCard = ({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) => (
  <div className="rounded-3xl border border-[#0f3b2c]/10 bg-[#f7fbf6] p-4">
    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
    <p className="mt-2 text-2xl font-bold text-[#062018]">{value}</p>
    {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
  </div>
);

export const FilterBar = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-wrap items-center gap-2">{children}</div>
);

export const SearchInput = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => (
  <div className="relative min-w-[220px] flex-1">
    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="rounded-full pl-9" />
  </div>
);

export const SelectField = ({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  label?: string;
  className?: string;
}) => (
  <select
    aria-label={label}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={cn("h-10 rounded-full border border-input bg-background px-4 text-sm", className)}
  >
    {options.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
);

export const TableWrap = ({ children }: { children: ReactNode }) => (
  // From tablet width up the table fits its space (cells wrap); only phones scroll sideways.
  <div className="overflow-x-auto rounded-2xl border border-border md:overflow-hidden">
    <table className="w-full min-w-[640px] text-left text-sm md:min-w-0">{children}</table>
  </div>
);

export const Th = ({ children, className }: { children?: ReactNode; className?: string }) => (
  <th className={cn("whitespace-nowrap bg-[#f7fbf6] px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground md:whitespace-normal md:px-2.5", className)}>{children}</th>
);

export const Td = ({ children, className, colSpan }: { children?: ReactNode; className?: string; colSpan?: number }) => (
  <td colSpan={colSpan} className={cn("border-t border-border px-3 py-2.5 align-middle md:px-2.5 md:[overflow-wrap:anywhere]", className)}>{children}</td>
);

export const Spinner = ({ label = "Loading..." }: { label?: string }) => (
  <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
    <Loader2 className="h-4 w-4 animate-spin" /> {label}
  </div>
);

export const EmptyState = ({ title, description }: { title: string; description?: string }) => (
  <div className="flex flex-col items-center gap-2 py-10 text-center">
    <Inbox className="h-8 w-8 text-muted-foreground/60" />
    <p className="text-sm font-semibold">{title}</p>
    {description && <p className="max-w-sm text-xs text-muted-foreground">{description}</p>}
  </div>
);

export const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="flex flex-col items-center gap-3 rounded-2xl bg-red-50 px-4 py-8 text-center">
    <AlertCircle className="h-6 w-6 text-red-600" />
    <p className="text-sm text-red-800">{message}</p>
    {onRetry && (
      <Button variant="outline" size="sm" className="rounded-full" onClick={onRetry}>
        Try again
      </Button>
    )}
  </div>
);

/** Renders loading, error or empty states, otherwise children. */
export const AsyncBody = ({
  loading,
  error,
  empty,
  emptyTitle,
  emptyDescription,
  onRetry,
  children,
}: {
  loading: boolean;
  error: string | null;
  empty: boolean;
  emptyTitle: string;
  emptyDescription?: string;
  onRetry?: () => void;
  children: ReactNode;
}) => {
  if (loading && empty) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (empty) return <EmptyState title={emptyTitle} description={emptyDescription} />;
  return <>{children}</>;
};

const TONES: Record<string, string> = {
  green: "bg-emerald-100 text-emerald-800",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-700",
  blue: "bg-sky-100 text-sky-800",
  slate: "bg-slate-100 text-slate-700",
};

export const Pill = ({ tone = "slate", children }: { tone?: keyof typeof TONES; children: ReactNode }) => (
  <span className={cn("inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold", TONES[tone])}>{children}</span>
);

export const Pager = ({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) => {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
      <span>
        {from}-{to} of {total}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span>
          Page {page} / {pages}
        </span>
        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  destructive,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent className="rounded-3xl">
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
        <AlertDialogAction
          className={cn("rounded-full", destructive && "bg-red-600 hover:bg-red-700")}
          onClick={onConfirm}
        >
          {confirmLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export const Field = ({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) => (
  <label className="block">
    <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
  </label>
);
