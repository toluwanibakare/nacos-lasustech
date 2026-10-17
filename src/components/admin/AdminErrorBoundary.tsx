import { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  /** Shown in the message, e.g. the section name. */
  label?: string;
}

interface State {
  error: Error | null;
}

/** Shows what broke instead of a blank screen. Wrap a section so the rest of the admin keeps working. */
class AdminErrorBoundary extends Component<Props, State> {
  public state: State = { error: null };

  public static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  public componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Admin error:", error, info.componentStack);
  }

  public render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-900">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm font-bold">{this.props.label ? `${this.props.label} failed to load` : "This page failed to load"}</p>
        </div>
        <p className="mt-3 break-words font-mono text-xs">{error.message}</p>
        <div className="mt-4 flex gap-2">
          <Button size="sm" className="rounded-full" onClick={() => this.setState({ error: null })}>Try again</Button>
          <Button size="sm" variant="outline" className="rounded-full" onClick={() => window.location.reload()}>Reload page</Button>
        </div>
      </div>
    );
  }
}

export default AdminErrorBoundary;
