import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import type { CandidateWithStatus } from "../lib/hooks/useGenerateFlashcards";

interface EditCandidateModalProps {
  isOpen: boolean;
  candidate: CandidateWithStatus | null;
  onSave: (candidate: CandidateWithStatus) => void;
  onCancel: () => void;
}

export function EditCandidateModal({ isOpen, candidate, onSave, onCancel }: EditCandidateModalProps) {
  const [formData, setFormData] = useState({
    frontText: "",
    backText: "",
  });
  const [errors, setErrors] = useState<{
    frontText?: string;
    backText?: string;
  }>({});

  // Reset form when candidate changes
  useEffect(() => {
    if (candidate) {
      setFormData({
        frontText: candidate.front_text,
        backText: candidate.back_text,
      });
      setErrors({});
    }
  }, [candidate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onCancel();
      } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        handleSave();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  const validateForm = () => {
    const newErrors: { frontText?: string; backText?: string } = {};

    if (!formData.frontText.trim()) {
      newErrors.frontText = "Pole nie może być puste";
    } else if (formData.frontText.length > 200) {
      newErrors.frontText = "Maksymalnie 200 znaków";
    }

    if (!formData.backText.trim()) {
      newErrors.backText = "Pole nie może być puste";
    } else if (formData.backText.length > 500) {
      newErrors.backText = "Maksymalnie 500 znaków";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!candidate || !validateForm()) return;

    const updatedCandidate: CandidateWithStatus = {
      ...candidate,
      front_text: formData.frontText.trim(),
      back_text: formData.backText.trim(),
      isEdited: true,
    };

    onSave(updatedCandidate);
  };

  const handleInputChange = (field: "frontText" | "backText", value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen || !candidate) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 id="modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
            Edytuj fiszkę
          </h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Front text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Pytanie (Front) <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.frontText}
              onChange={(e) => handleInputChange("frontText", e.target.value)}
              className={`w-full p-3 border rounded-md resize-none ${
                errors.frontText
                  ? "border-red-300 dark:border-red-600 focus:border-red-500"
                  : "border-gray-300 dark:border-gray-600 focus:border-blue-500"
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              rows={3}
              maxLength={200}
              placeholder="Wprowadź pytanie..."
            />
            <div className="flex justify-between items-center mt-1">
              {errors.frontText && <span className="text-sm text-red-600 dark:text-red-400">{errors.frontText}</span>}
              <span className="text-sm text-gray-500 dark:text-gray-400">{formData.frontText.length}/200</span>
            </div>
          </div>

          {/* Back text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Odpowiedź (Back) <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.backText}
              onChange={(e) => handleInputChange("backText", e.target.value)}
              className={`w-full p-3 border rounded-md resize-none ${
                errors.backText
                  ? "border-red-300 dark:border-red-600 focus:border-red-500"
                  : "border-gray-300 dark:border-gray-600 focus:border-blue-500"
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              rows={5}
              maxLength={500}
              placeholder="Wprowadź odpowiedź..."
            />
            <div className="flex justify-between items-center mt-1">
              {errors.backText && <span className="text-sm text-red-600 dark:text-red-400">{errors.backText}</span>}
              <span className="text-sm text-gray-500 dark:text-gray-400">{formData.backText.length}/500</span>
            </div>
          </div>

          {/* Confidence score */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Pewność AI: {(candidate.confidence * 100).toFixed(0)}%
            </label>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  candidate.confidence >= 0.8
                    ? "bg-green-500"
                    : candidate.confidence >= 0.6
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
                style={{ width: `${candidate.confidence * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={onCancel} variant="outline" className="px-4 py-2">
            Anuluj
          </Button>
          <Button onClick={handleSave} className="px-4 py-2" disabled={Object.keys(errors).length > 0}>
            Zapisz zmiany
          </Button>
        </div>
      </div>
    </div>
  );
}
