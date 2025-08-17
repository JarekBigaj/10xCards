import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function ChangePasswordModal({ isOpen, onClose, onSuccess }: ChangePasswordModalProps) {
  const [formData, setFormData] = useState<FormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    setGlobalError(null);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = "Obecne hasło jest wymagane";
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "Nowe hasło jest wymagane";
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "Hasło musi mieć co najmniej 8 znaków";
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      newErrors.newPassword = "Hasło musi zawierać małą literę, dużą literę i cyfrę";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Potwierdzenie hasła jest wymagane";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Hasła nie są zgodne";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        setGlobalError(result.error || "Wystąpił błąd podczas zmiany hasła");
        return;
      }

      // Success
      if (onSuccess) {
        onSuccess();
      }

      // Reset form and close modal
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setErrors({});
      onClose();

      // Show success message (could be replaced with a toast notification)
      alert("Hasło zostało zmienione pomyślnie!");
    } catch (error) {
      console.error("Change password error:", error);
      setGlobalError("Błąd połączenia. Spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setErrors({});
      setGlobalError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
            <span>Zmień hasło</span>
          </DialogTitle>
          <DialogDescription>Wprowadź obecne hasło i wybierz nowe bezpieczne hasło.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {globalError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3" role="alert">
              <span className="text-sm text-destructive">{globalError}</span>
            </div>
          )}

          {/* Current Password */}
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-foreground mb-2">
              Obecne hasło
            </label>
            <input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              value={formData.currentPassword}
              onChange={(e) => updateField("currentPassword", e.target.value)}
              disabled={isLoading}
              className={`
                w-full px-3 py-2 border rounded-md shadow-sm
                focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                transition-colors duration-200
                ${errors.currentPassword ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary/20"}
                ${isLoading ? "bg-muted cursor-not-allowed" : "bg-background"}
              `}
              placeholder="••••••••"
            />
            {errors.currentPassword && <p className="mt-1 text-sm text-destructive">{errors.currentPassword}</p>}
          </div>

          {/* New Password */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-foreground mb-2">
              Nowe hasło
            </label>
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              required
              value={formData.newPassword}
              onChange={(e) => updateField("newPassword", e.target.value)}
              disabled={isLoading}
              className={`
                w-full px-3 py-2 border rounded-md shadow-sm
                focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                transition-colors duration-200
                ${errors.newPassword ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary/20"}
                ${isLoading ? "bg-muted cursor-not-allowed" : "bg-background"}
              `}
              placeholder="••••••••"
            />
            {errors.newPassword && <p className="mt-1 text-sm text-destructive">{errors.newPassword}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
              Potwierdź nowe hasło
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={(e) => updateField("confirmPassword", e.target.value)}
              disabled={isLoading}
              className={`
                w-full px-3 py-2 border rounded-md shadow-sm
                focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                transition-colors duration-200
                ${errors.confirmPassword ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary/20"}
                ${isLoading ? "bg-muted cursor-not-allowed" : "bg-background"}
              `}
              placeholder="••••••••"
            />
            {errors.confirmPassword && <p className="mt-1 text-sm text-destructive">{errors.confirmPassword}</p>}
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 space-y-2 space-y-reverse sm:space-y-0 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isLoading}>
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
                  Zmieniam...
                </div>
              ) : (
                "Zmień hasło"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
