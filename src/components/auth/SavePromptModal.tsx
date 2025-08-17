import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";

interface SavePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateCount: number; // Liczba fiszek do zapisania
  onLoginRedirect?: () => void;
  onRegisterRedirect?: () => void;
}

export function SavePromptModal({
  isOpen,
  onClose,
  candidateCount,
  onLoginRedirect,
  onRegisterRedirect,
}: SavePromptModalProps) {
  const handleLoginClick = () => {
    if (onLoginRedirect) {
      onLoginRedirect();
    } else {
      // Default behavior - preserve current page state in session storage
      const currentUrl = window.location.pathname + window.location.search;
      sessionStorage.setItem("auth-redirect-to", currentUrl);
      window.location.href = `/auth/login?redirectTo=${encodeURIComponent(currentUrl)}`;
    }
  };

  const handleRegisterClick = () => {
    if (onRegisterRedirect) {
      onRegisterRedirect();
    } else {
      // Default behavior - preserve current page state in session storage
      const currentUrl = window.location.pathname + window.location.search;
      sessionStorage.setItem("auth-redirect-to", currentUrl);
      window.location.href = `/auth/register?redirectTo=${encodeURIComponent(currentUrl)}`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <span>Zaloguj się aby zapisać fiszki</span>
          </DialogTitle>
          <DialogDescription className="text-base">
            Masz <span className="font-semibold text-foreground">{candidateCount}</span> wygenerowanych fiszek. Zaloguj
            się lub utwórz konto, aby je zapisać i móc z nich korzystać w przyszłości.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-3 mt-6">
          <Button onClick={handleLoginClick} className="w-full">
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
            Zaloguj się
          </Button>

          <Button variant="outline" onClick={handleRegisterClick} className="w-full">
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

          <Button variant="ghost" onClick={onClose} className="w-full">
            Kontynuuj bez zapisywania
          </Button>
        </div>

        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-start space-x-2">
            <svg className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">Dlaczego warto się zarejestrować?</p>
              <ul className="space-y-1">
                <li>• Zapisuj swoje fiszki na stałe</li>
                <li>• Śledź postępy w nauce</li>
                <li>• Synchronizuj między urządzeniami</li>
                <li>• Używaj zaawansowanych funkcji nauki</li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
