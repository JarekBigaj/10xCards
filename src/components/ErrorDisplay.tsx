import React from "react";
import { Button } from "./ui/button";
import { RetryCountdown } from "./RetryCountdown";
import type { AiServiceError } from "../../types";

interface ErrorDisplayProps {
  error: AiServiceError;
  onRetry: () => void;
  onDismiss: () => void;
}

export function ErrorDisplay({ error, onRetry, onDismiss }: ErrorDisplayProps) {
  const getErrorIcon = () => {
    switch (error.code) {
      case "RATE_LIMIT":
        return (
          <svg className="w-6 h-6 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "TIMEOUT":
        return (
          <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "MODEL_ERROR":
        return (
          <svg className="w-6 h-6 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  const getErrorTitle = () => {
    switch (error.code) {
      case "RATE_LIMIT":
        return "Przekroczono limit zapytań";
      case "TIMEOUT":
        return "Przekroczono czas oczekiwania";
      case "MODEL_ERROR":
        return "Błąd modelu AI";
      case "INVALID_REQUEST":
        return "Nieprawidłowe żądanie";
      default:
        return "Wystąpił błąd";
    }
  };

  const getErrorDescription = () => {
    switch (error.code) {
      case "RATE_LIMIT":
        return "Przekroczono limit zapytań do serwisu AI. Spróbuj ponownie za chwilę.";
      case "TIMEOUT":
        return "Generowanie trwało zbyt długo. Sprawdź połączenie internetowe i spróbuj ponownie.";
      case "MODEL_ERROR":
        return "Wystąpił błąd w modelu AI. Spróbuj ponownie lub skontaktuj się z pomocą techniczną.";
      case "INVALID_REQUEST":
        return "Nieprawidłowe dane wejściowe. Sprawdź wprowadzony tekst i spróbuj ponownie.";
      default:
        return error.message || "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.";
    }
  };

  const getRetryText = () => {
    switch (error.code) {
      case "RATE_LIMIT":
        return error.retry_after ? `Spróbuj ponownie za ${Math.ceil(error.retry_after / 1000)}s` : "Spróbuj ponownie";
      case "TIMEOUT":
        return "Spróbuj ponownie";
      case "MODEL_ERROR":
        return "Spróbuj ponownie";
      default:
        return "Spróbuj ponownie";
    }
  };

  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        {/* Error icon */}
        <div className="flex-shrink-0 mt-0.5">{getErrorIcon()}</div>

        {/* Error content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">{getErrorTitle()}</h3>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">{getErrorDescription()}</p>

          {/* Actions */}
          <div className="mt-3 flex items-center space-x-3">
            {error.is_retryable && (
              <Button
                onClick={onRetry}
                size="sm"
                variant="outline"
                className="text-red-700 border-red-300 hover:bg-red-100 dark:text-red-300 dark:border-red-600 dark:hover:bg-red-900/30"
                disabled={error.retry_after ? error.retry_after > 0 : false}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                {getRetryText()}
              </Button>
            )}

            <Button
              onClick={onDismiss}
              size="sm"
              variant="ghost"
              className="text-red-700 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-900/30"
            >
              Zamknij
            </Button>
          </div>

          {/* Retry countdown for rate limit */}
          {error.code === "RATE_LIMIT" && error.retry_after && error.retry_after > 0 && (
            <RetryCountdown retryAfter={error.retry_after} onRetry={onRetry} />
          )}
        </div>

        {/* Dismiss button */}
        <div className="flex-shrink-0">
          <button onClick={onDismiss} className="text-red-400 hover:text-red-600 dark:hover:text-red-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
