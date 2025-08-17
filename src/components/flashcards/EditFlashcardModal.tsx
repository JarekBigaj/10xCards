import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { CharacterCounter } from "../CharacterCounter";
import { Loader2 } from "lucide-react";
import type { FlashcardDto, UpdateFlashcardRequest } from "../../types";

interface EditFlashcardModalProps {
  isOpen: boolean;
  flashcard: FlashcardDto | null;
  onClose: () => void;
  onSuccess: (request: UpdateFlashcardRequest) => void;
  isLoading: boolean;
}

export function EditFlashcardModal({ isOpen, flashcard, onClose, onSuccess, isLoading }: EditFlashcardModalProps) {
  const [frontText, setFrontText] = useState("");
  const [backText, setBackText] = useState("");
  const [source, setSource] = useState<"ai-edit" | "manual">("manual");
  const [errors, setErrors] = useState<{
    frontText?: string;
    backText?: string;
    source?: string;
  }>({});

  // Initialize form when flashcard changes
  useEffect(() => {
    if (flashcard) {
      setFrontText(flashcard.front_text);
      setBackText(flashcard.back_text);
      // Set appropriate source for editing
      setSource(flashcard.source === "ai-full" ? "ai-edit" : "manual");
      setErrors({});
    }
  }, [flashcard]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!frontText.trim()) {
      newErrors.frontText = "Pole nie może być puste";
    } else if (frontText.length > 200) {
      newErrors.frontText = "Maksymalnie 200 znaków";
    }

    if (!backText.trim()) {
      newErrors.backText = "Pole nie może być puste";
    } else if (backText.length > 500) {
      newErrors.backText = "Maksymalnie 500 znaków";
    }

    if (!source) {
      newErrors.source = "Wybierz źródło";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const hasChanges = () => {
    if (!flashcard) return false;

    return (
      frontText.trim() !== flashcard.front_text ||
      backText.trim() !== flashcard.back_text ||
      source !== (flashcard.source === "ai-full" ? "ai-edit" : flashcard.source)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !hasChanges()) {
      return;
    }

    const request: UpdateFlashcardRequest = {
      front_text: frontText.trim(),
      back_text: backText.trim(),
      source,
    };

    onSuccess(request);
  };

  const handleClose = () => {
    if (!isLoading) {
      setFrontText("");
      setBackText("");
      setSource("manual");
      setErrors({});
      onClose();
    }
  };

  if (!flashcard) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edytuj fiszkę</DialogTitle>
          <DialogDescription>Zaktualizuj treść fiszki. Wprowadź zmiany i zapisz.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Front text */}
          <div className="space-y-2">
            <label htmlFor="edit-front-text" className="text-sm font-medium">
              Przód fiszki *
            </label>
            <div className="space-y-1">
              <Textarea
                id="edit-front-text"
                value={frontText}
                onChange={(e) => setFrontText(e.target.value)}
                placeholder="Pytanie lub pojęcie..."
                className={errors.frontText ? "border-destructive" : ""}
                rows={3}
                disabled={isLoading}
              />
              <div className="flex justify-between items-center">
                <CharacterCounter current={frontText.length} max={200} min={0} />
                {errors.frontText && <span className="text-sm text-destructive">{errors.frontText}</span>}
              </div>
            </div>
          </div>

          {/* Back text */}
          <div className="space-y-2">
            <label htmlFor="edit-back-text" className="text-sm font-medium">
              Tył fiszki *
            </label>
            <div className="space-y-1">
              <Textarea
                id="edit-back-text"
                value={backText}
                onChange={(e) => setBackText(e.target.value)}
                placeholder="Odpowiedź lub wyjaśnienie..."
                className={errors.backText ? "border-destructive" : ""}
                rows={4}
                disabled={isLoading}
              />
              <div className="flex justify-between items-center">
                <CharacterCounter current={backText.length} max={500} min={0} />
                {errors.backText && <span className="text-sm text-destructive">{errors.backText}</span>}
              </div>
            </div>
          </div>

          {/* Source */}
          <div className="space-y-2">
            <label htmlFor="edit-source" className="text-sm font-medium">
              Źródło *
            </label>
            <div className="space-y-1">
              <Select
                value={source}
                onValueChange={(value: "ai-edit" | "manual") => setSource(value)}
                disabled={isLoading}
              >
                <SelectTrigger className={errors.source ? "border-destructive" : ""}>
                  <SelectValue placeholder="Wybierz źródło" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Ręczne</SelectItem>
                  <SelectItem value="ai-edit">AI (edytowane)</SelectItem>
                </SelectContent>
              </Select>
              {errors.source && <span className="text-sm text-destructive">{errors.source}</span>}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isLoading || !frontText.trim() || !backText.trim() || !hasChanges()}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Zapisywanie...
                </>
              ) : (
                "Zapisz zmiany"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
