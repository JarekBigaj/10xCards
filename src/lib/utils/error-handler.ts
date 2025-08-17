// Centralized error handling dla flashcard operations
export class FlashcardError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode = 500,
    public isRetryable = false
  ) {
    super(message);
    this.name = "FlashcardError";
  }
}

export function handleFlashcardApiError(error: unknown): FlashcardError {
  if (error instanceof FlashcardError) {
    return error;
  }

  if (error instanceof Error) {
    // Parse API error responses
    if (error.message.includes("404") || error.message.includes("not found")) {
      return new FlashcardError("Fiszka nie została znaleziona lub została usunięta", "NOT_FOUND", 404, false);
    }

    if (error.message.includes("duplicate") || error.message.includes("already exists")) {
      return new FlashcardError("Fiszka o tej treści już istnieje", "DUPLICATE", 409, false);
    }

    if (error.message.includes("validation") || error.message.includes("invalid")) {
      return new FlashcardError(
        "Nieprawidłowe dane wejściowe. Sprawdź poprawność wprowadzonych informacji.",
        "VALIDATION_ERROR",
        400,
        false
      );
    }

    if (error.message.includes("permission") || error.message.includes("unauthorized")) {
      return new FlashcardError(
        "Brak uprawnień do tej operacji. Spróbuj się wylogować i zalogować ponownie.",
        "PERMISSION_DENIED",
        403,
        false
      );
    }

    if (error.message.includes("rate limit") || error.message.includes("too many requests")) {
      return new FlashcardError("Za dużo żądań. Spróbuj ponownie za chwilę.", "RATE_LIMIT", 429, true);
    }

    if (error.message.includes("network") || error.message.includes("fetch")) {
      return new FlashcardError(
        "Błąd połączenia z serwerem. Sprawdź połączenie internetowe.",
        "NETWORK_ERROR",
        0,
        true
      );
    }

    if (error.message.includes("timeout")) {
      return new FlashcardError("Operacja przekroczyła limit czasu. Spróbuj ponownie.", "TIMEOUT", 408, true);
    }
  }

  // Generic server error
  return new FlashcardError(
    "Wystąpił nieoczekiwany błąd serwera. Spróbuj ponownie za chwilę.",
    "UNKNOWN_ERROR",
    500,
    true
  );
}

// User-friendly error messages
export function getErrorMessage(error: unknown): string {
  const flashcardError = handleFlashcardApiError(error);
  return flashcardError.message;
}

// Check if error is retryable
export function isRetryable(error: unknown): boolean {
  const flashcardError = handleFlashcardApiError(error);
  return flashcardError.isRetryable;
}

// Log error for monitoring
export function logError(error: unknown) {
  const flashcardError = handleFlashcardApiError(error);

  // In production, send to monitoring service
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "exception", {
      description: `${flashcardError.code}: ${flashcardError.message}`,
      fatal: flashcardError.statusCode >= 500,
    });
  }
}
