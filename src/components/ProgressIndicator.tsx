import React from "react";
import type { GenerationMetadata } from "../../types";

interface ProgressIndicatorProps {
  progress: GenerationMetadata | null;
  retryCount: number;
  status: "preparing" | "generating" | "processing" | "complete";
}

export function ProgressIndicator({ progress, retryCount, status }: ProgressIndicatorProps) {
  const getStatusText = () => {
    switch (status) {
      case "preparing":
        return "Przygotowywanie tekstu...";
      case "generating":
        return "Generowanie kandydatów...";
      case "processing":
        return "Przetwarzanie wyników...";
      case "complete":
        return "Zakończono!";
      default:
        return "Przetwarzanie...";
    }
  };

  const getProgressPercentage = () => {
    if (!progress) return 0;

    // Estimate progress based on processing time
    const estimatedTime = 15000; // 15 seconds estimated
    const elapsed = progress.processing_time_ms || 0;
    return Math.min(95, (elapsed / estimatedTime) * 100);
  };

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500 ease-out relative"
          style={{ width: `${getProgressPercentage()}%` }}
        >
          {/* Pulsing animation */}
          <div className="absolute inset-0 bg-white opacity-20 animate-pulse rounded-full" />
        </div>
      </div>

      {/* Status text */}
      <div className="text-center">
        <p className="text-gray-700 dark:text-gray-300 font-medium">{getStatusText()}</p>

        {progress && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Czas przetwarzania: {(progress.processing_time_ms / 1000).toFixed(1)}s
          </p>
        )}
      </div>

      {/* Loading spinner */}
      <div className="flex justify-center">
        <div className="relative">
          <svg
            className="animate-spin h-8 w-8 text-blue-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>

          {/* AI icon overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
