import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Shown instead of the default panel, e.g. a smaller one for a single section. */
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches a render error instead of letting it blank the page.
 *
 * Without this, one thrown error anywhere in the tree unmounts the whole app
 * and the user is left looking at white. A lazy route chunk that fails to load
 * after a deploy is the most common cause, and reloading fixes exactly that,
 * which is why reload is the primary action.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Replace with your error reporter (Sentry, etc.) when one is wired up.
    console.error("Render error:", error, info.componentStack);
  }

  private handleReload = () => window.location.reload();

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-lg font-semibold text-foreground">This page didn't load</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Something went wrong while rendering. Reloading usually fixes it. If it keeps happening,
          let the club administrator know.
        </p>
        <button
          onClick={this.handleReload}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Reload the page
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
