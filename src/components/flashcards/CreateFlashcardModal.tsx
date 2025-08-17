import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { CharacterCounter } from "../CharacterCounter";
import { Loader2 } from "lucide-react";
import type { CreateFlashcardRequest } from "../../types";

interface CreateFlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (request: CreateFlashcardRequest) => void;
  isLoading: boolean;
}

export function CreateFlashcardModal({ isOpen, onClose, onSuccess, isLoading }: CreateFlashcardModalProps) {
  const [frontText, setFrontText] = useState("");
  const [backText, setBackText] = useState("");
  const [source, setSource] = useState<"manual">("manual");
  const [errors, setErrors] = useState<{
    frontText?: string;
    backText?: string;
    source?: string;
  }>({});

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const request: CreateFlashcardRequest = {
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dodaj nową fiszkę</DialogTitle>
          <DialogDescription>Utwórz nową fiszkę do nauki. Wypełnij oba pola i wybierz źródło.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Front text */}
          <div className="space-y-2">
            <label htmlFor="front-text" className="text-sm font-medium">
              Przód fiszki *
            </label>
            <div className="space-y-1">
              <Textarea
                id="front-text"
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
            <label htmlFor="back-text" className="text-sm font-medium">
              Tył fiszki *
            </label>
            <div className="space-y-1">
              <Textarea
                id="back-text"
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
            <label htmlFor="source" className="text-sm font-medium">
              Źródło *
            </label>
            <div className="space-y-1">
              <Select value={source} onValueChange={(value: "manual") => setSource(value)} disabled={isLoading}>
                <SelectTrigger className={errors.source ? "border-destructive" : ""}>
                  <SelectValue placeholder="Wybierz źródło" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Ręczne</SelectItem>
                </SelectContent>
              </Select>
              {errors.source && <span className="text-sm text-destructive">{errors.source}</span>}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isLoading || !frontText.trim() || !backText.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Tworzenie...
                </>
              ) : (
                "Dodaj fiszkę"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
