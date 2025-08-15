import React from "react";
import { Button } from "./ui/button";

interface GenerateButtonProps {
  onClick: () => void;
  isLoading: boolean;
  disabled: boolean;
  text: string;
}

export function GenerateButton({ onClick, isLoading, disabled, text }: GenerateButtonProps) {
  const handleClick = () => {
    if (!disabled && !isLoading && text.trim()) {
      onClick();
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className="w-full sm:w-auto px-8 py-3 text-lg font-medium"
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
          <span>Generowanie...</span>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Generuj fiszki</span>
        </div>
      )}
    </Button>
  );
}
