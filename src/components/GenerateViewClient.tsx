import React from "react";
import { useGenerateFlashcards } from "../lib/hooks/useGenerateFlashcards";
import { TextInputSection } from "./TextInputSection";
import { LoadingSection } from "./LoadingSection";
import { ResultsSection } from "./ResultsSection";
import { ErrorDisplay } from "./ErrorDisplay";
import { EditCandidateModal } from "./EditCandidateModal";
import { SuccessNotification } from "./SuccessNotification";

interface GenerateViewClientProps {
  user?: {
    id: string;
    email: string;
    email_confirmed: boolean;
    created_at: Date;
  } | null;
}

export default function GenerateViewClient({ user }: GenerateViewClientProps) {
  const { state, actions } = useGenerateFlashcards();

  return (
    <div className="space-y-8">
      {/* TextInputSection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Wprowadź tekst do analizy</h2>
        <TextInputSection
          value={state.inputText}
          onChange={actions.updateInputText}
          onGenerate={() => actions.generateCandidates(state.inputText)}
          isGenerating={state.isLoading}
          validationErrors={state.validationErrors}
        />
      </div>

      {/* LoadingSection */}
      {state.phase === "loading" && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <LoadingSection
            progress={state.generationMetadata}
            retryCount={state.generationMetadata?.retry_count || 0}
            onCancel={actions.cancelGeneration}
          />
        </div>
      )}

      {/* ResultsSection */}
      {state.phase === "results" && state.candidates.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <ResultsSection
            candidates={state.candidates}
            onCandidateUpdate={actions.updateCandidate}
            onBulkAction={actions.bulkAction}
            onSave={actions.saveSelectedCandidates}
            isSaving={state.isSaving}
            onEditCandidate={actions.openCandidateEdit}
            isLoggedIn={!!user}
          />
        </div>
      )}

      {/* ErrorDisplay */}
      {state.error && (
        <ErrorDisplay error={state.error} onRetry={actions.retryGeneration} onDismiss={actions.clearError} />
      )}

      {/* EditCandidateModal - tylko dla zalogowanych */}
      {user && (
        <EditCandidateModal
          isOpen={state.editingCandidate !== null}
          candidate={state.editingCandidate}
          onSave={actions.saveCandidateEdit}
          onCancel={actions.cancelCandidateEdit}
        />
      )}

      {/* Success Notification */}
      <SuccessNotification
        isVisible={state.showSuccessNotification}
        flashcards={state.savedFlashcards}
        onDismiss={actions.dismissSuccessNotification}
      />
    </div>
  );
}
