import React from "react";
import { Button } from "./ui/button";
import { CheckCircle, X, ArrowRight } from "lucide-react";
import { cn } from "../lib/utils";
import type { FlashcardDto } from "../types";

interface SuccessNotificationProps {
  isVisible: boolean;
  flashcards: FlashcardDto[];
  onDismiss: () => void;
  className?: string;
}

export function SuccessNotification({ isVisible, flashcards, onDismiss, className }: SuccessNotificationProps) {
  if (!isVisible) return null;

  const flashcardsCount = flashcards.length;
  const getFlashcardsText = (count: number) => {
    if (count === 1) return "fiszkę";
    if (count < 5) return "fiszki";
    return "fiszek";
  };

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 max-w-md w-full mx-auto",
        "bg-green-50 border border-green-200 rounded-lg shadow-lg p-4",
        "animate-in slide-in-from-bottom-2 duration-300",
        className
      )}
    >
      <div className="flex items-start space-x-3">
        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-green-800">
            Zapisano {flashcardsCount} {getFlashcardsText(flashcardsCount)}!
          </h4>
          <p className="mt-1 text-sm text-green-700">Twoje fiszki zostały pomyślnie dodane do kolekcji.</p>

          <div className="mt-3 flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => (window.location.href = "/flashcards")}
              className="bg-white border-green-300 text-green-700 hover:bg-green-50"
            >
              Przejdź do Moich fiszek
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => (window.location.href = "/study")}
              className="bg-white border-green-300 text-green-700 hover:bg-green-50"
            >
              Rozpocznij naukę
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="flex-shrink-0 h-6 w-6 p-0 text-green-600 hover:text-green-800 hover:bg-green-100"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
