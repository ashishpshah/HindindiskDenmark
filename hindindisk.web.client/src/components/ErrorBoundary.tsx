import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode; fallback?: ReactNode };
type State = { hasError: boolean; error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="font-display text-3xl font-bold text-destructive">Something went wrong</h1>
          <p className="text-muted-foreground">{this.state.error?.message ?? "An unexpected error occurred."}</p>
          <button
            className="rounded-full gradient-primary px-6 py-2 text-primary-foreground font-semibold"
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = "/"; }}
          >
            Go to Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
