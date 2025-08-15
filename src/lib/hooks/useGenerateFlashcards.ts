import { useState, useCallback, useMemo } from "react";
import type {
  AiCandidate,
  AiGenerateCandidatesRequest,
  AiGenerateCandidatesResponse,
  CreateFlashcardsRequest,
  AiServiceError,
  GenerationMetadata,
} from "../../types";

// Typy stanu
export type GenerationPhase = "input" | "loading" | "results" | "error";

export type CandidateStatus = "pending" | "accepted" | "rejected";

export interface CandidateWithStatus extends AiCandidate {
  status: CandidateStatus;
  isEdited: boolean;
  validationErrors?: {
    frontText?: string;
    backText?: string;
  };
}

export interface ValidationErrors {
  inputText?: string;
  frontText?: string;
  backText?: string;
}

export interface GenerateViewState {
  phase: GenerationPhase;
  inputText: string;
  candidates: CandidateWithStatus[];
  selectedCandidates: string[];
  isLoading: boolean;
  isSaving: boolean;
  error: AiServiceError | null;
  validationErrors: ValidationErrors;
  generationMetadata: GenerationMetadata | null;
  editingCandidate: CandidateWithStatus | null;
}

// Stan początkowy
const initialState: GenerateViewState = {
  phase: "input",
  inputText: "",
  candidates: [],
  selectedCandidates: [],
  isLoading: false,
  isSaving: false,
  error: null,
  validationErrors: {},
  generationMetadata: null,
  editingCandidate: null,
};

// Debounce utility
function debounce<T extends (...args: never[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function useGenerateFlashcards() {
  const [state, setState] = useState<GenerateViewState>(() => {
    // Load from session storage on init (only in browser)
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("ai-candidates");
      const candidates = stored ? JSON.parse(stored) : [];
      return {
        ...initialState,
        candidates,
        phase: candidates.length > 0 ? "results" : "input",
      };
    }
    return initialState;
  });

  // Session storage persistence
  const persistToSession = useCallback((candidates: CandidateWithStatus[]) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("ai-candidates", JSON.stringify(candidates));
    }
  }, []);

  // Walidacja input text
  const validateInputText = useMemo(
    () =>
      debounce((text: string) => {
        const errors: ValidationErrors = {};
        if (text.length < 1000) {
          errors.inputText = "Tekst jest za krótki, minimalnie 1000 znaków";
        }
        if (text.length > 10000) {
          errors.inputText = "Tekst jest za długi, maksymalnie 10000 znaków";
        }
        setState((prev) => ({ ...prev, validationErrors: errors }));
      }, 300),
    []
  );

  // Walidacja kandydata
  const validateCandidate = useCallback((candidate: CandidateWithStatus) => {
    const errors: { frontText?: string; backText?: string } = {};

    if (!candidate.front_text.trim()) {
      errors.frontText = "Pole nie może być puste";
    } else if (candidate.front_text.length > 200) {
      errors.frontText = "Maksymalnie 200 znaków";
    }

    if (!candidate.back_text.trim()) {
      errors.backText = "Pole nie może być puste";
    } else if (candidate.back_text.length > 500) {
      errors.backText = "Maksymalnie 500 znaków";
    }

    return errors;
  }, []);

  // Funkcje akcji
  const updateInputText = useCallback(
    (text: string) => {
      setState((prev) => ({ ...prev, inputText: text }));
      validateInputText(text);
    },
    [validateInputText]
  );

  const generateCandidates = useCallback(
    async (text: string) => {
      if (text.length < 1000 || text.length > 10000) {
        return;
      }

      setState((prev) => ({
        ...prev,
        phase: "loading",
        isLoading: true,
        error: null,
        generationMetadata: null,
      }));

      try {
        const request: AiGenerateCandidatesRequest = { text };
        const response = await fetch("/api/ai/generate-candidates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Błąd generowania kandydatów");
        }

        const data: AiGenerateCandidatesResponse = await response.json();

        const candidatesWithStatus: CandidateWithStatus[] = data.data.candidates.map((candidate) => ({
          ...candidate,
          status: "pending" as CandidateStatus,
          isEdited: false,
        }));

        setState((prev) => ({
          ...prev,
          phase: "results",
          isLoading: false,
          candidates: candidatesWithStatus,
          generationMetadata: data.data.generation_metadata,
        }));

        persistToSession(candidatesWithStatus);
      } catch (error) {
        const aiError: AiServiceError = {
          code: "UNKNOWN",
          message: error instanceof Error ? error.message : "Nieznany błąd",
          is_retryable: true,
        };

        setState((prev) => ({
          ...prev,
          phase: "error",
          isLoading: false,
          error: aiError,
        }));
      }
    },
    [persistToSession]
  );

  const updateCandidate = useCallback(
    (id: string, updates: Partial<CandidateWithStatus>) => {
      setState((prev) => {
        const updatedCandidates = prev.candidates.map((candidate) =>
          candidate.id === id ? { ...candidate, ...updates, isEdited: true } : candidate
        );

        persistToSession(updatedCandidates);
        return { ...prev, candidates: updatedCandidates };
      });
    },
    [persistToSession]
  );

  const saveSelectedCandidates = useCallback(async () => {
    const acceptedCandidates = state.candidates.filter((c) => c.status === "accepted");

    if (acceptedCandidates.length === 0) {
      return;
    }

    setState((prev) => ({ ...prev, isSaving: true }));

    try {
      const request: CreateFlashcardsRequest = {
        flashcards: acceptedCandidates.map((candidate) => ({
          front_text: candidate.front_text,
          back_text: candidate.back_text,
          source: "ai-full" as const,
          candidate_id: candidate.id,
        })),
      };

      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Błąd zapisywania fiszek");
      }

      // Clear session storage and reset state
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("ai-candidates");
      }
      setState((prev) => ({
        ...initialState,
        inputText: prev.inputText, // Keep input text for potential reuse
        phase: "input",
      }));

      // Show success message - in production this should be replaced with a proper notification system
      // For now, we'll use a simple success state that can be handled by the UI
      setState((prev) => ({
        ...prev,
        isSaving: false,
        // TODO: Add success notification state and redirect to flashcards list
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isSaving: false,
        error: {
          code: "UNKNOWN",
          message: error instanceof Error ? error.message : "Błąd zapisywania",
          is_retryable: true,
        },
      }));
    }
  }, [state.candidates]);

  const bulkAction = useCallback(
    (action: "accept-all" | "reject-all" | "clear-selection") => {
      setState((prev) => {
        let updatedCandidates = [...prev.candidates];

        switch (action) {
          case "accept-all":
            updatedCandidates = updatedCandidates.map((c) => ({ ...c, status: "accepted" as CandidateStatus }));
            break;
          case "reject-all":
            updatedCandidates = updatedCandidates.map((c) => ({ ...c, status: "rejected" as CandidateStatus }));
            break;
          case "clear-selection":
            updatedCandidates = updatedCandidates.map((c) => ({ ...c, status: "pending" as CandidateStatus }));
            break;
        }

        persistToSession(updatedCandidates);
        return { ...prev, candidates: updatedCandidates };
      });
    },
    [persistToSession]
  );

  const retryGeneration = useCallback(() => {
    if (state.inputText) {
      generateCandidates(state.inputText);
    }
  }, [state.inputText, generateCandidates]);

  const cancelGeneration = useCallback(() => {
    setState((prev) => ({
      ...prev,
      phase: "input",
      isLoading: false,
      generationMetadata: null,
    }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const saveCandidateEdit = useCallback(
    (candidate: CandidateWithStatus) => {
      const errors = validateCandidate(candidate);
      if (Object.keys(errors).length > 0) {
        updateCandidate(candidate.id, { validationErrors: errors });
        return;
      }

      updateCandidate(candidate.id, {
        ...candidate,
        validationErrors: undefined,
        isEdited: true,
      });
      setState((prev) => ({ ...prev, editingCandidate: null }));
    },
    [updateCandidate, validateCandidate]
  );

  const cancelCandidateEdit = useCallback(() => {
    setState((prev) => ({ ...prev, editingCandidate: null }));
  }, []);

  const openCandidateEdit = useCallback((candidate: CandidateWithStatus) => {
    setState((prev) => ({ ...prev, editingCandidate: candidate }));
  }, []);

  return {
    state,
    actions: {
      updateInputText,
      generateCandidates,
      updateCandidate,
      saveSelectedCandidates,
      bulkAction,
      retryGeneration,
      cancelGeneration,
      clearError,
      saveCandidateEdit,
      cancelCandidateEdit,
      openCandidateEdit,
    },
  };
}
