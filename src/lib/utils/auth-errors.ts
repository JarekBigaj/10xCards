import { AuthError } from "@supabase/supabase-js";
import { ZodError } from "zod";

export function handleAuthError(error: AuthError): Response {
  const errorMap: Record<string, { status: number; message: string; code: string }> = {
    invalid_credentials: {
      status: 401,
      message: "Nieprawidłowy email lub hasło",
      code: "INVALID_CREDENTIALS",
    },
    signup_disabled: {
      status: 400,
      message: "Rejestracja jest obecnie wyłączona",
      code: "SIGNUP_DISABLED",
    },
    email_address_invalid: {
      status: 400,
      message: "Nieprawidłowy format email",
      code: "INVALID_EMAIL",
    },
    password_too_short: {
      status: 400,
      message: "Hasło jest za krótkie",
      code: "WEAK_PASSWORD",
    },
    user_already_registered: {
      status: 409,
      message: "Konto z tym adresem już istnieje",
      code: "EMAIL_EXISTS",
    },
    email_not_confirmed: {
      status: 400,
      message: "Potwierdź swój adres email",
      code: "EMAIL_NOT_CONFIRMED",
    },
    too_many_requests: {
      status: 429,
      message: "Za dużo prób. Spróbuj ponownie za chwilę",
      code: "RATE_LIMIT",
    },
  };

  const mappedError = errorMap[error.message] || {
    status: 500,
    message: "Wystąpił błąd serwera",
    code: "SERVER_ERROR",
  };

  return new Response(
    JSON.stringify({
      success: false,
      error: mappedError.message,
      code: mappedError.code,
    }),
    {
      status: mappedError.status,
      headers: { "Content-Type": "application/json" },
    }
  );
}

export function handleValidationError(error: ZodError): Response {
  const firstError = error.errors[0];

  return new Response(
    JSON.stringify({
      success: false,
      error: firstError.message,
      code: "VALIDATION_ERROR",
      details: error.errors,
    }),
    {
      status: 400,
      headers: { "Content-Type": "application/json" },
    }
  );
}

export function handleServerError(error: unknown): Response {
  console.error("Server error:", error);

  return new Response(
    JSON.stringify({
      success: false,
      error: "Wystąpił błąd serwera",
      code: "SERVER_ERROR",
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  );
}
