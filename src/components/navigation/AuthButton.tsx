import React from "react";
import { Button } from "../ui/button";

export function AuthButton() {
  return (
    <div className="flex items-center space-x-3">
      {/* Link rejestracji */}
      <a
        href="/auth/register"
        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        Zarejestruj się
      </a>

      {/* Przycisk logowania - główny CTA zgodnie z US-016 */}
      <Button asChild size="sm">
        <a href="/auth/login">Zaloguj się</a>
      </Button>
    </div>
  );
}
