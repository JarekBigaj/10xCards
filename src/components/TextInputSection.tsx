import React from "react";
import { TextAreaInput } from "./TextAreaInput";
import { CharacterCounter } from "./CharacterCounter";
import { ValidationMessage } from "./ValidationMessage";
import type { ValidationErrors } from "../lib/hooks/useGenerateFlashcards";
import { GenerateButton } from "./GenerateButton";

interface TextInputSectionProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  validationErrors: ValidationErrors;
}

export function TextInputSection({
  value,
  onChange,
  onGenerate,
  isGenerating,
  validationErrors,
}: TextInputSectionProps) {
  const isValid = value.length >= 1000 && value.length <= 10000 && !validationErrors.inputText;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <TextAreaInput
          value={value}
          onChange={onChange}
          placeholder="Wklej tutaj tekst do analizy (1000-10000 znaków)..."
          minLength={1000}
          maxLength={10000}
          disabled={isGenerating}
        />

        <div className="flex items-center justify-between">
          <CharacterCounter current={value.length} min={1000} max={10000} />

          <ValidationMessage
            error={validationErrors.inputText}
            isValid={!validationErrors.inputText && value.length > 0}
          />
        </div>
      </div>

      <GenerateButton onClick={onGenerate} isLoading={isGenerating} disabled={!isValid || isGenerating} text={value} />
    </div>
  );
}
