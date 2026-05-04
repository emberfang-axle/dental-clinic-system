import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("App error:", error, info.componentStack);
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-ink-950 flex items-center justify-center p-6">
          <div className="glass-strong rounded-2xl p-10 max-w-md text-center shadow-luxe">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="font-serif text-2xl text-gold-shine mb-3">Something went wrong</h2>
            <p className="text-sm text-gold-100/60 mb-6">{this.state.error.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 rounded-md bg-gold-gradient text-ink-950 text-sm font-semibold hover:brightness-110 transition"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
