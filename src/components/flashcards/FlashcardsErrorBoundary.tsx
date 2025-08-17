import React, { Component, type ReactNode, type ErrorInfo } from "react";
import { Button } from "../ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface FlashcardsErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface FlashcardsErrorBoundaryProps {
  children: ReactNode;
}
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}

export class FlashcardsErrorBoundary extends Component<FlashcardsErrorBoundaryProps, FlashcardsErrorBoundaryState> {
  constructor(props: FlashcardsErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<FlashcardsErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log error to monitoring service (in production, use proper error logging service)
    // console.error("FlashcardsErrorBoundary caught an error:", error, errorInfo);

    // In production, send to error tracking service
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "exception", {
        description: `React Error Boundary: ${error.message}`,
        fatal: true,
      });
    }
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/dashboard";
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-background">
          <div className="max-w-md w-full text-center">
            <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />

            <h2 className="text-2xl font-bold text-foreground mb-2">Ups! Coś poszło nie tak</h2>

            <p className="text-muted-foreground text-center mb-6">
              Wystąpił błąd podczas ładowania Twoich fiszek. Spróbuj odświeżyć stronę lub wróć do dashboard i spróbuj
              ponownie.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={this.handleRefresh} variant="default" className="flex items-center">
                <RefreshCw className="w-4 h-4 mr-2" />
                Odśwież stronę
              </Button>

              <Button onClick={this.handleGoHome} variant="outline" className="flex items-center">
                <Home className="w-4 h-4 mr-2" />
                Wróć do Dashboard
              </Button>

              <Button onClick={this.handleReset} variant="ghost" size="sm" className="text-muted-foreground">
                Spróbuj ponownie
              </Button>
            </div>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-6 p-4 bg-muted rounded-lg text-left">
                <summary className="cursor-pointer font-medium text-sm mb-2">
                  Szczegóły błędu (tylko w trybie deweloperskim)
                </summary>
                <div className="text-xs">
                  <div className="mb-2">
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  <div className="mb-2">
                    <strong>Component Stack:</strong>
                    <pre className="mt-1 whitespace-pre-wrap text-xs bg-background p-2 rounded border overflow-auto max-h-32">
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                  <div>
                    <strong>Error Stack:</strong>
                    <pre className="mt-1 whitespace-pre-wrap text-xs bg-background p-2 rounded border overflow-auto max-h-32">
                      {this.state.error.stack}
                    </pre>
                  </div>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
