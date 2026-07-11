import { Component, type ErrorInfo, type ReactNode } from "react";
import { errorBus } from "@/services/errors/ErrorBus";
import { AppError } from "@/services/errors/AppError";
import { reportLovableError } from "@/lib/lovable-error-reporting";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  boundary?: string;
}

interface State {
  error: Error | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    errorBus.report(
      new AppError("unknown", error.message, { cause: error }),
      { boundary: this.props.boundary ?? "AppErrorBoundary", componentStack: info.componentStack },
    );
    reportLovableError(error, {
      boundary: this.props.boundary ?? "AppErrorBoundary",
      componentStack: info.componentStack,
    });
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback(this.state.error, this.reset);
      return (
        <div className="px-4 pt-2">
          <div className="glass-card max-w-sm p-6 text-center">
            <h2 className="text-lg font-semibold">Etwas ist schiefgelaufen</h2>
            <p className="mt-2 text-sm text-muted-foreground break-words">
              {this.state.error.message}
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={this.reset}
                className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Erneut versuchen
              </button>
              <a
                href="/settings/diagnostics"
                className="rounded-full border border-border px-4 py-2 text-sm font-medium"
              >
                Diagnose
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
