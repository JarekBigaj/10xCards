import React from "react";
import { Button } from "./ui/button";
import { ProgressIndicator } from "./ProgressIndicator";
import type { GenerationMetadata } from "../types";

interface LoadingSectionProps {
  progress: GenerationMetadata | null;
  retryCount: number;
  onCancel?: () => void;
}

export function LoadingSection({ progress, retryCount, onCancel }: LoadingSectionProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Generowanie fiszek AI</h3>
        <p className="text-gray-600 dark:text-gray-400">Analizuję tekst i tworzę kandydatów na fiszki...</p>
      </div>

      <ProgressIndicator progress={progress} status="generating" />

      {onCancel && (
        <div className="flex justify-center">
          <Button onClick={onCancel} variant="outline" className="px-6 py-2">
            Anuluj generowanie
          </Button>
        </div>
      )}

      {retryCount > 0 && (
        <div className="text-center">
          <p className="text-sm text-amber-600 dark:text-amber-400">Próba {retryCount + 1} - ponawiam generowanie...</p>
        </div>
      )}
    </div>
  );
}
