import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
import type { FlashcardDto } from "../../types";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  flashcard: FlashcardDto | null;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export function DeleteConfirmationModal({
  isOpen,
  flashcard,
  onClose,
  onConfirm,
  isLoading,
}: DeleteConfirmationModalProps) {
  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  if (!flashcard) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-destructive">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Usuń fiszkę
          </DialogTitle>
          <DialogDescription>
            Ta operacja jest nieodwracalna. Fiszka zostanie trwale usunięta z Twojej kolekcji.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div>
              <span className="text-sm font-medium text-muted-foreground">Przód:</span>
              <p className="text-sm break-words">{truncateText(flashcard.front_text, 150)}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Tył:</span>
              <p className="text-sm break-words">{truncateText(flashcard.back_text, 200)}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
            Anuluj
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Usuwanie...
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 mr-2" />
                Usuń fiszkę
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
