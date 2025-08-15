import React from "react";

interface ValidationMessageProps {
  error?: string;
  isValid?: boolean;
}

export function ValidationMessage({ error, isValid }: ValidationMessageProps) {
  if (!error && !isValid) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      {error ? (
        <div className="flex items-center space-x-1">
          <svg className="w-4 h-4 text-red-500 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm text-red-500 dark:text-red-400">{error}</span>
        </div>
      ) : isValid ? (
        <div className="flex items-center space-x-1">
          <svg className="w-4 h-4 text-green-500 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm text-green-500 dark:text-green-400">Gotowe do generowania</span>
        </div>
      ) : null}
    </div>
  );
}
