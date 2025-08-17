import React, { useState } from "react";
import { Button } from "../ui/button";
import { ChangePasswordModal } from "./ChangePasswordModal";
import { DeleteAccountModal } from "./DeleteAccountModal";

interface User {
  id: string;
  email?: string;
  email_confirmed: boolean;
  created_at: Date;
}

interface ProfileManagerProps {
  user: User;
}

export function ProfileManager({ user }: ProfileManagerProps) {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  const handleResendConfirmation = async () => {
    try {
      // This would call a resend confirmation email endpoint
      // For now, we'll just show an alert
      alert("Email potwierdzający został wysłany ponownie. Sprawdź swoją skrzynkę.");
    } catch (error) {
      console.error("Error resending confirmation:", error);
      alert("Wystąpił błąd podczas wysyłania emaila. Spróbuj ponownie.");
    }
  };

  return (
    <>
      {/* Account Information Section */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-card-foreground">Informacje o koncie</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">Premium: Niedostępne</span>
        </div>

        <div className="space-y-6">
          {/* Email */}
          <div>
            <div className="block text-sm font-medium text-foreground mb-2">Adres email</div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
              <span className="text-card-foreground">{user.email}</span>
              {user.email_confirmed ? (
                <span className="flex items-center text-xs text-green-600 dark:text-green-400">
                  <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Potwierdzony
                </span>
              ) : (
                <button
                  onClick={handleResendConfirmation}
                  className="text-xs text-amber-600 dark:text-amber-400 hover:underline"
                >
                  Potwierdź email
                </button>
              )}
            </div>
          </div>

          {/* Member Since */}
          <div>
            <div className="block text-sm font-medium text-foreground mb-2">Członek od</div>
            <div className="p-3 bg-muted/50 rounded-md">
              <span className="text-card-foreground">
                {user.created_at.toLocaleDateString("pl-PL", { year: "numeric", month: "long" })}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
            <Button onClick={() => setShowChangePassword(true)} className="flex-1">
              Zmień hasło
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // For now, just show change password modal for "Edit profile"
                // In the future, this could open a profile edit modal
                setShowChangePassword(true);
              }}
              className="flex-1"
            >
              Edytuj profil
            </Button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-card border border-destructive/20 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-destructive mb-2">Strefa niebezpieczna</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Te akcje są nieodwracalne. Upewnij się, że naprawdę chcesz je wykonać.
        </p>
        <Button variant="destructive" onClick={() => setShowDeleteAccount(true)}>
          Usuń konto
        </Button>
      </div>

      {/* Modals */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onSuccess={() => {
          // Could show a success toast or refresh data
          console.log("Password changed successfully");
        }}
      />

      <DeleteAccountModal
        isOpen={showDeleteAccount}
        onClose={() => setShowDeleteAccount(false)}
        userEmail={user.email}
      />
    </>
  );
}
