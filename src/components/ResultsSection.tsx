import React from "react";
import { Button } from "./ui/button";
import { ResultsHeader } from "./ResultsHeader";
import { BulkActionsBar } from "./BulkActionsBar";
import { CandidatesTable } from "./CandidatesTable";
import { SaveSelectedButton } from "./SaveSelectedButton";
import type { CandidateWithStatus } from "../lib/hooks/useGenerateFlashcards";

interface ResultsSectionProps {
  candidates: CandidateWithStatus[];
  onCandidateUpdate: (id: string, updates: Partial<CandidateWithStatus>) => void;
  onBulkAction: (action: "accept-all" | "reject-all" | "clear-selection") => void;
  onSave: () => void;
  isSaving: boolean;
  onEditCandidate?: (candidate: CandidateWithStatus) => void;
}

export function ResultsSection({
  candidates,
  onCandidateUpdate,
  onBulkAction,
  onSave,
  isSaving,
  onEditCandidate,
}: ResultsSectionProps) {
  const acceptedCount = candidates.filter((c) => c.status === "accepted").length;
  const rejectedCount = candidates.filter((c) => c.status === "rejected").length;
  const pendingCount = candidates.filter((c) => c.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Header with statistics */}
      <ResultsHeader
        totalCount={candidates.length}
        acceptedCount={acceptedCount}
        rejectedCount={rejectedCount}
        pendingCount={pendingCount}
      />

      {/* Bulk actions */}
      <BulkActionsBar
        candidatesCount={candidates.length}
        selectedCount={acceptedCount}
        onAcceptAll={() => onBulkAction("accept-all")}
        onRejectAll={() => onBulkAction("reject-all")}
        onClearSelection={() => onBulkAction("clear-selection")}
      />

      {/* Candidates table */}
      <CandidatesTable
        candidates={candidates}
        onCandidateUpdate={onCandidateUpdate}
        onEdit={onEditCandidate || (() => {})}
        onToggleStatus={(id, status) => {
          onCandidateUpdate(id, { status });
        }}
      />

      {/* Save button */}
      <div className="flex justify-center pt-4 border-t border-gray-200 dark:border-gray-700">
        <SaveSelectedButton
          selectedCount={acceptedCount}
          onSave={onSave}
          isLoading={isSaving}
          disabled={acceptedCount === 0 || isSaving}
        />
      </div>
    </div>
  );
}
