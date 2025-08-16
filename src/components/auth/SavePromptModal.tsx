import React, { useEffect } from "react";
import { Button } from "../ui/button";

interface SavePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateCount: number; // Liczba fiszek do zapisania
}

export function SavePromptModal({ isOpen, onClose, candidateCount }: SavePromptModalProps) {
  // Zamknij modal po naciśnięciu Escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Zapobiegaj scrollowaniu tła
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Przekieruj do logowania z parametrem redirectTo
  const handleLogin = () => {
    const currentPath = window.location.pathname;
    window.location.href = `/auth/login?redirectTo=${encodeURIComponent(currentPath)}`;
  };

  // Przekieruj do rejestracji z parametrem redirectTo
  const handleRegister = () => {
    const currentPath = window.location.pathname;
    window.location.href = `/auth/register?redirectTo=${encodeURIComponent(currentPath)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      {/* Modal */}
      <div
        className="relative w-full max-w-md mx-4 bg-card border border-border rounded-xl shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-prompt-title"
        aria-describedby="save-prompt-description"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Zamknij"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="text-center mb-6">
            <h2 id="save-prompt-title" className="text-lg font-semibold text-card-foreground mb-2">
              Zaloguj się aby zapisać fiszki
            </h2>
            <p id="save-prompt-description" className="text-muted-foreground">
              Masz {candidateCount} {candidateCount === 1 ? "fiszkę" : candidateCount <= 4 ? "fiszki" : "fiszek"}{" "}
              gotowych do zapisania. Zaloguj się lub utwórz darmowe konto, aby je zachować.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {/* Główny przycisk - Zaloguj się */}
            <Button onClick={handleLogin} className="w-full" size="lg">
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Zaloguj się
            </Button>

            {/* Drugie miejsce - Zarejestruj się */}
            <Button onClick={handleRegister} variant="outline" className="w-full" size="lg">
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
              Utwórz nowe konto
            </Button>

            {/* Opcja - kontynuuj bez zapisywania */}
            <button
              onClick={onClose}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Kontynuuj bez zapisywania
            </button>
          </div>

          {/* Footer info */}
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground text-center">
              💡 <strong>Wskazówka:</strong> Możesz nadal generować fiszki bez konta, ale nie będziesz mógł ich zapisać
              ani synchronizować między urządzeniami.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
