import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertCircle className="h-10 w-10" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-bold text-foreground">Something went wrong</h1>
          <p className="mt-2 max-w-md text-muted-foreground">
            An unexpected error occurred in the dashboard. We've been notified and are working on a fix.
          </p>
          
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button onClick={this.handleReset} className="gap-2 rounded-xl px-8 shadow-lg shadow-primary/20">
              <RotateCcw className="h-4 w-4" />
              Try Again
            </Button>
            <Button onClick={this.handleGoHome} variant="outline" className="gap-2 rounded-xl px-8">
              <Home className="h-4 w-4" />
              Go to Homepage
            </Button>
          </div>

          {process.env.NODE_ENV === "development" && (
            <div className="mt-12 w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-muted/30 p-4 text-left">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Error Details (Dev Only):</p>
              <pre className="overflow-auto text-[10px] text-red-500 font-mono">
                {this.state.error?.stack}
              </pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
