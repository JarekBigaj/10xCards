import React from "react";
import { Button } from "./ui/button";

interface BulkActionsBarProps {
  candidatesCount: number;
  selectedCount: number;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onClearSelection: () => void;
}

export function BulkActionsBar({
  candidatesCount,
  selectedCount,
  onAcceptAll,
  onRejectAll,
  onClearSelection,
}: BulkActionsBarProps) {
  if (candidatesCount === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">Akcje grupowe:</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={onAcceptAll}
          variant="outline"
          size="sm"
          className="text-green-600 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-600 dark:hover:bg-green-900/20"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Zaakceptuj wszystkie
        </Button>

        <Button
          onClick={onRejectAll}
          variant="outline"
          size="sm"
          className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/20"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Odrzuć wszystkie
        </Button>

        <Button
          onClick={onClearSelection}
          variant="outline"
          size="sm"
          className="text-gray-600 border-gray-300 hover:bg-gray-50 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Wyczyść wybór
        </Button>
      </div>

      {selectedCount > 0 && (
        <div className="text-sm text-green-600 dark:text-green-400 font-medium">{selectedCount} zaakceptowanych</div>
      )}
    </div>
  );
}
