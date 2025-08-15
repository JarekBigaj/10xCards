import React from "react";
import { CandidateRow } from "./CandidateRow.tsx";
import type { CandidateWithStatus, CandidateStatus } from "../lib/hooks/useGenerateFlashcards";

interface CandidatesTableProps {
  candidates: CandidateWithStatus[];
  onCandidateUpdate: (id: string, updates: Partial<CandidateWithStatus>) => void;
  onEdit: (candidate: CandidateWithStatus) => void;
  onToggleStatus: (id: string, status: CandidateStatus) => void;
}

export function CandidatesTable({ candidates, onCandidateUpdate, onEdit, onToggleStatus }: CandidatesTableProps) {
  if (candidates.length === 0) {
    return <div className="text-center py-8 text-gray-500 dark:text-gray-400">Brak kandydatów do wyświetlenia</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Pytanie (Front)</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Odpowiedź (Back)</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Pewność</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Akcje</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {candidates.map((candidate) => (
            <CandidateRow
              key={candidate.id}
              candidate={candidate}
              onUpdate={onCandidateUpdate}
              onEdit={onEdit}
              onToggleStatus={onToggleStatus}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
