import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

export function DeleteAccountModal({ isOpen, onClose, userEmail }: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expectedText = "USUŃ KONTO";
  const isConfirmed = confirmText === expectedText;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isConfirmed) {
      setError("Wprowadź poprawny tekst potwierdzenia");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Wystąpił błąd podczas usuwania konta");
        return;
      }

      // Success - redirect to home page
      alert("Konto zostało usunięte pomyślnie. Zostaniesz przekierowany na stronę główną.");
      window.location.href = "/";
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Log error for debugging (in production, use proper error logging service)
      // console.error("Delete account error:", error);
      setError("Błąd połączenia. Spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setConfirmText("");
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-destructive">
            <div className="h-8 w-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <span>Usuń konto</span>
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <p className="text-base">
              <strong>Ta akcja jest nieodwracalna!</strong>
            </p>
            <p>
              Usuwając konto, stracisz dostęp do wszystkich swoich fiszek i danych. Wszystkie informacje zostaną trwale
              usunięte.
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3" role="alert">
              <span className="text-sm text-destructive">{error}</span>
            </div>
          )}

          {/* User email confirmation */}
          {userEmail && (
            <div className="p-3 bg-muted/50 rounded-md">
              <p className="text-sm text-muted-foreground">Usuwane konto:</p>
              <p className="font-medium text-foreground">{userEmail}</p>
            </div>
          )}

          {/* Data deletion warning */}
          <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-md">
            <h4 className="text-sm font-medium text-foreground mb-2">Co zostanie usunięte:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Wszystkie Twoje fiszki</li>
              <li>• Historia nauki i statystyki</li>
              <li>• Preferencje i ustawienia konta</li>
              <li>• Dane osobowe i profil</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Confirmation input */}
            <div>
              <label htmlFor="confirmText" className="block text-sm font-medium text-foreground mb-2">
                Aby potwierdzić, wpisz: <span className="font-mono font-bold text-destructive">{expectedText}</span>
              </label>
              <input
                id="confirmText"
                type="text"
                required
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                disabled={isLoading}
                className={`
                  w-full px-3 py-2 border rounded-md shadow-sm
                  focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                  transition-colors duration-200 font-mono
                  ${!isConfirmed && confirmText ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary/20"}
                  ${isLoading ? "bg-muted cursor-not-allowed" : "bg-background"}
                `}
                placeholder={expectedText}
              />
              {confirmText && !isConfirmed && (
                <p className="mt-1 text-sm text-destructive">
                  Tekst nie jest poprawny. Wpisz dokładnie: {expectedText}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 space-y-2 space-y-reverse sm:space-y-0 pt-4">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                Anuluj
              </Button>
              <Button type="submit" variant="destructive" disabled={!isConfirmed || isLoading}>
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="mr-2 h-4 w-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Usuwam konto...
                  </div>
                ) : (
                  "Usuń konto na zawsze"
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
