import React from "react";
import { Button } from "./ui/button";
import type { FlashcardDto } from "../types";

interface SaveSelectedButtonProps {
  selectedCount: number;
  onSave: (onSuccess?: (flashcards: FlashcardDto[]) => void) => void;
  isLoading: boolean;
  disabled: boolean;
  onSaveSuccess?: (flashcards: FlashcardDto[]) => void;
}

export function SaveSelectedButton({
  selectedCount,
  onSave,
  isLoading,
  disabled,
  onSaveSuccess,
}: SaveSelectedButtonProps) {
  const handleSave = () => {
    onSave(onSaveSuccess);
  };

  return (
    <Button
      onClick={handleSave}
      disabled={disabled || isLoading}
      className="px-8 py-3 text-lg font-medium"
      variant={disabled ? "outline" : "default"}
    >
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
          <span>Zapisywanie...</span>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
            />
          </svg>
          <span>
            Zapisz {selectedCount} {selectedCount === 1 ? "fiszkę" : selectedCount < 5 ? "fiszki" : "fiszek"}
          </span>
        </div>
      )}
    </Button>
  );
}
