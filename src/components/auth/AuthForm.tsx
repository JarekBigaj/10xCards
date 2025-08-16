import React, { useState } from "react";
import { Button } from "../ui/button";

export type AuthFormMode = "login" | "register" | "forgot-password" | "reset-password";

interface AuthFormProps {
  mode: AuthFormMode;
  onSuccess?: (user: any) => void;
  redirectTo?: string;
  resetToken?: string; // Dla reset-password
}

interface AuthFormValues {
  email: string;
  password: string;
  confirmPassword?: string;
}

// Komunikaty błędów zgodne ze specyfikacją
const AUTH_ERROR_MESSAGES = {
  INVALID_CREDENTIALS: "Nieprawidłowy email lub hasło",
  EMAIL_EXISTS: "Konto z tym adresem już istnieje",
  EMAIL_NOT_CONFIRMED: "Potwierdź swój adres email",
  RATE_LIMIT: "Za dużo prób. Spróbuj ponownie za chwilę",
  INVALID_TOKEN: "Link resetujący jest nieprawidłowy",
  EXPIRED_TOKEN: "Link resetujący wygasł",
  WEAK_PASSWORD: "Hasło jest za słabe",
  NETWORK_ERROR: "Błąd połączenia. Sprawdź internet",
  UNKNOWN: "Wystąpił błąd serwera",
} as const;

// Walidacja email (podstawowa)
const validateEmail = (email: string): string | undefined => {
  if (!email.trim()) return "Email jest wymagany";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Nieprawidłowy format email";
  return undefined;
};

// Walidacja hasła zgodnie z US-001
const validatePassword = (password: string, mode: AuthFormMode): string | undefined => {
  if (mode === "login") {
    if (!password) return "Hasło jest wymagane";
    return undefined;
  }

  if (mode === "register" || mode === "reset-password") {
    if (!password) return "Hasło jest wymagane";
    if (password.length < 8) return "Hasło musi mieć co najmniej 8 znaków";
    // Opcjonalna walidacja siły hasła
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return "Hasło musi zawierać małą literę, dużą literę i cyfrę";
    }
    return undefined;
  }

  return undefined;
};

// Komponent wskaźnika siły hasła
function PasswordStrength({ password }: { password: string }) {
  const getStrength = (pwd: string): "weak" | "medium" | "strong" => {
    if (pwd.length < 8) return "weak";

    let score = 0;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^a-zA-Z\d]/.test(pwd)) score++;

    if (score >= 3) return "strong";
    if (score >= 2) return "medium";
    return "weak";
  };

  if (!password) return null;

  const strength = getStrength(password);

  return (
    <div className="mt-2">
      <div className="flex space-x-1">
        <div
          className={`h-1 w-1/3 rounded-full transition-colors ${
            strength === "weak" ? "bg-destructive" : strength === "medium" ? "bg-yellow-500" : "bg-green-500"
          }`}
        />
        <div
          className={`h-1 w-1/3 rounded-full transition-colors ${
            strength === "medium" || strength === "strong"
              ? strength === "medium"
                ? "bg-yellow-500"
                : "bg-green-500"
              : "bg-muted"
          }`}
        />
        <div
          className={`h-1 w-1/3 rounded-full transition-colors ${strength === "strong" ? "bg-green-500" : "bg-muted"}`}
        />
      </div>
      <p
        className={`mt-1 text-xs ${
          strength === "weak"
            ? "text-destructive"
            : strength === "medium"
              ? "text-yellow-600 dark:text-yellow-400"
              : "text-green-600 dark:text-green-400"
        }`}
      >
        Siła hasła: {strength === "weak" ? "Słabe" : strength === "medium" ? "Średnie" : "Silne"}
      </p>
    </div>
  );
}

export function AuthForm({ mode, onSuccess, redirectTo, resetToken }: AuthFormProps) {
  const [formData, setFormData] = useState<AuthFormValues>({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Aktualizacja pola formularza z walidacją w czasie rzeczywistym
  const updateField = (field: keyof AuthFormValues, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }

    // Real-time validation
    let fieldError: string | undefined;

    if (field === "email") {
      fieldError = validateEmail(value);
    } else if (field === "password") {
      fieldError = validatePassword(value, mode);
    } else if (field === "confirmPassword" && (mode === "register" || mode === "reset-password")) {
      if (value !== formData.password) {
        fieldError = "Hasła nie są zgodne";
      }
    }

    if (fieldError) {
      setErrors((prev) => ({ ...prev, [field]: fieldError! }));
    }
  };

  // Walidacja całego formularza
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    if (mode !== "forgot-password") {
      const passwordError = validatePassword(formData.password, mode);
      if (passwordError) newErrors.password = passwordError;
    }

    if ((mode === "register" || mode === "reset-password") && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Hasła nie są zgodne";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Obsługa submit formularza
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // TODO: Tutaj będzie integracja z API
      console.log(`${mode} attempt:`, {
        email: formData.email,
        password: formData.password,
        resetToken,
      });

      // Symulacja API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Symulacja sukcesu
      if (onSuccess) {
        onSuccess({ email: formData.email });
      }

      // TODO: Przekierowanie będzie obsługiwane przez routing
      console.log(`Success! Would redirect to: ${redirectTo || "/dashboard"}`);
    } catch (error) {
      // TODO: Mapowanie błędów z API
      setGlobalError(AUTH_ERROR_MESSAGES.UNKNOWN);
    } finally {
      setIsLoading(false);
    }
  };

  // Konfiguracja tekstów dla różnych trybów
  const getFormConfig = () => {
    switch (mode) {
      case "login":
        return {
          title: "Zaloguj się",
          submitText: "Zaloguj się",
          showPassword: true,
          showConfirmPassword: false,
          showForgotPassword: true,
        };
      case "register":
        return {
          title: "Utwórz konto",
          submitText: "Utwórz konto",
          showPassword: true,
          showConfirmPassword: true,
          showForgotPassword: false,
        };
      case "forgot-password":
        return {
          title: "Odzyskaj hasło",
          submitText: "Wyślij link resetujący",
          showPassword: false,
          showConfirmPassword: false,
          showForgotPassword: false,
        };
      case "reset-password":
        return {
          title: "Ustaw nowe hasło",
          submitText: "Zmień hasło",
          showPassword: true,
          showConfirmPassword: true,
          showForgotPassword: false,
        };
    }
  };

  const config = getFormConfig();
  const isValid =
    !Object.values(errors).some((error) => !!error) &&
    formData.email &&
    (mode === "forgot-password" || formData.password);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {globalError && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3" role="alert">
          <div className="flex items-center">
            <svg className="mr-2 h-4 w-4 text-destructive" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm text-destructive">{globalError}</span>
          </div>
        </div>
      )}

      {/* Email field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
          Adres email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={formData.email}
          onChange={(e) => updateField("email", e.target.value)}
          disabled={isLoading}
          className={`
            w-full px-3 py-2 border rounded-md shadow-sm placeholder-muted-foreground
            focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
            transition-colors duration-200
            ${errors.email ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary/20"}
            ${isLoading ? "bg-muted cursor-not-allowed" : "bg-background"}
          `}
          placeholder="twoj@email.com"
          aria-invalid={errors.email ? "true" : "false"}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && (
          <p id="email-error" className="mt-1 text-sm text-destructive" role="alert">
            {errors.email}
          </p>
        )}
      </div>

      {/* Password field */}
      {config.showPassword && (
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
            Hasło
          </label>
          <input
            id="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            value={formData.password}
            onChange={(e) => updateField("password", e.target.value)}
            disabled={isLoading}
            className={`
              w-full px-3 py-2 border rounded-md shadow-sm placeholder-muted-foreground
              focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
              transition-colors duration-200
              ${
                errors.password ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary/20"
              }
              ${isLoading ? "bg-muted cursor-not-allowed" : "bg-background"}
            `}
            placeholder="••••••••"
            aria-invalid={errors.password ? "true" : "false"}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
          {errors.password && (
            <p id="password-error" className="mt-1 text-sm text-destructive" role="alert">
              {errors.password}
            </p>
          )}

          {/* Password strength indicator for register/reset */}
          {(mode === "register" || mode === "reset-password") && <PasswordStrength password={formData.password} />}
        </div>
      )}

      {/* Confirm password field */}
      {config.showConfirmPassword && (
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
            Potwierdź hasło
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
              w-full px-3 py-2 border rounded-md shadow-sm placeholder-muted-foreground
              focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
              transition-colors duration-200
              ${
                errors.confirmPassword
                  ? "border-destructive focus:ring-destructive/20"
                  : "border-border focus:ring-primary/20"
              }
              ${isLoading ? "bg-muted cursor-not-allowed" : "bg-background"}
            `}
            placeholder="••••••••"
            aria-invalid={errors.confirmPassword ? "true" : "false"}
            aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
          />
          {errors.confirmPassword && (
            <p id="confirm-password-error" className="mt-1 text-sm text-destructive" role="alert">
              {errors.confirmPassword}
            </p>
          )}
        </div>
      )}

      {/* Submit button */}
      <Button type="submit" className="w-full" disabled={!isValid || isLoading} size="lg">
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
            Ładowanie...
          </div>
        ) : (
          config.submitText
        )}
      </Button>

      {/* Forgot password link */}
      {config.showForgotPassword && (
        <div className="text-center">
          <a href="/auth/forgot-password" className="text-sm text-primary hover:text-primary/80 transition-colors">
            Zapomniałeś hasła?
          </a>
        </div>
      )}

      {/* Mode-specific links */}
      <div className="text-center text-sm text-muted-foreground">
        {mode === "login" ? (
          <span>
            Nie masz konta?{" "}
            <a href="/auth/register" className="text-primary hover:text-primary/80 transition-colors">
              Zarejestruj się
            </a>
          </span>
        ) : mode === "register" ? (
          <span>
            Masz już konto?{" "}
            <a href="/auth/login" className="text-primary hover:text-primary/80 transition-colors">
              Zaloguj się
            </a>
          </span>
        ) : mode === "forgot-password" ? (
          <span>
            Pamiętasz hasło?{" "}
            <a href="/auth/login" className="text-primary hover:text-primary/80 transition-colors">
              Zaloguj się
            </a>
          </span>
        ) : (
          <span>
            <a href="/auth/login" className="text-primary hover:text-primary/80 transition-colors">
              Powrót do logowania
            </a>
          </span>
        )}
      </div>
    </form>
  );
}
