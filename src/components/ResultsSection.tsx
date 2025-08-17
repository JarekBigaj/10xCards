import React, { useState } from "react";
import { ResultsHeader } from "./ResultsHeader";
import { BulkActionsBar } from "./BulkActionsBar";
import { CandidatesTable } from "./CandidatesTable";
import { SaveSelectedButton } from "./SaveSelectedButton";
import { SavePromptModal } from "./auth/SavePromptModal";
import type { CandidateWithStatus } from "../lib/hooks/useGenerateFlashcards";

interface ResultsSectionProps {
  candidates: CandidateWithStatus[];
  onCandidateUpdate: (id: string, updates: Partial<CandidateWithStatus>) => void;
  onBulkAction: (action: "accept-all" | "reject-all" | "clear-selection") => void;
  onSave: () => void;
  isSaving: boolean;
  onEditCandidate?: (candidate: CandidateWithStatus) => void;
  isLoggedIn: boolean;
}

export function ResultsSection({
  candidates,
  onCandidateUpdate,
  onBulkAction,
  onSave,
  isSaving,
  onEditCandidate,
  isLoggedIn,
}: ResultsSectionProps) {
  const [showSavePrompt, setShowSavePrompt] = useState(false);

  const acceptedCount = candidates.filter((c) => c.status === "accepted").length;
  const rejectedCount = candidates.filter((c) => c.status === "rejected").length;
  const pendingCount = candidates.filter((c) => c.status === "pending").length;

  const handleSaveClick = () => {
    if (isLoggedIn) {
      // Zalogowany użytkownik - zapisuj od razu
      onSave();
    } else {
      // Niezalogowany użytkownik - pokaż modal zgodnie z US-016
      setShowSavePrompt(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with statistics */}
      <ResultsHeader
        totalCount={candidates.length}
        acceptedCount={acceptedCount}
        rejectedCount={rejectedCount}
        pendingCount={pendingCount}
      />

      {/* Bulk actions - tylko dla zalogowanych */}
      {isLoggedIn && (
        <BulkActionsBar
          candidatesCount={candidates.length}
          selectedCount={acceptedCount}
          onAcceptAll={() => onBulkAction("accept-all")}
          onRejectAll={() => onBulkAction("reject-all")}
          onClearSelection={() => onBulkAction("clear-selection")}
        />
      )}

      {/* Candidates table */}
      <CandidatesTable
        candidates={candidates}
        onCandidateUpdate={onCandidateUpdate}
        onEdit={
          onEditCandidate ||
          (() => {
            /* No-op */
          })
        }
        onToggleStatus={(id, status) => {
          onCandidateUpdate(id, { status });
        }}
        isLoggedIn={isLoggedIn}
      />

      {/* Save button - dla wszystkich użytkowników zgodnie z US-016 */}
      <div className="flex justify-center pt-4 border-t border-gray-200 dark:border-gray-700">
        <SaveSelectedButton
          selectedCount={acceptedCount}
          onSave={handleSaveClick}
          isLoading={isSaving}
          disabled={acceptedCount === 0 || isSaving}
        />
      </div>

      {/* SavePromptModal - dla niezalogowanych użytkowników */}
      <SavePromptModal
        isOpen={showSavePrompt}
        onClose={() => setShowSavePrompt(false)}
        candidateCount={acceptedCount}
      />
    </div>
  );
}
