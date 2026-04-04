// Composant React Error Boundary — capte les erreurs JS non gérées
// Affiche une UI de fallback propre au lieu du crash blanc
import { Component, type ErrorInfo, type ReactNode } from "react";
import { useLanguage } from "@/context/LanguageContext";

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

function ErrorFallback({ error }: { error: Error | null }) {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full rounded-2xl border border-destructive/20 bg-card p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <svg className="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h2 className="font-heading text-xl font-bold text-foreground mb-2">{t("error.unexpected")}</h2>
        <p className="text-sm text-muted-foreground mb-1">
          {error?.message ?? t("error.unknown")}
        </p>
        <p className="text-xs text-muted-foreground mb-6">
          {t("error.refresh")}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {t("error.refreshBtn")}
        </button>
      </div>
    </div>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // En production, envoyer à un service de monitoring (ex. Sentry)
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
