import React, { useState } from "react";
import { Button } from "./ui/button";
import type { CandidateWithStatus, CandidateStatus } from "../lib/hooks/useGenerateFlashcards";

interface CandidateRowProps {
  candidate: CandidateWithStatus;
  onUpdate: (id: string, updates: Partial<CandidateWithStatus>) => void;
  onEdit: (candidate: CandidateWithStatus) => void;
  onToggleStatus: (id: string, status: CandidateStatus) => void;
  isLoggedIn: boolean;
}

export function CandidateRow({ candidate, onUpdate, onEdit, onToggleStatus, isLoggedIn }: CandidateRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editFront, setEditFront] = useState(candidate.front_text);
  const [editBack, setEditBack] = useState(candidate.back_text);

  const getStatusBadge = (status: CandidateStatus) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";

    switch (status) {
      case "accepted":
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400`}>
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Zaakceptowana
          </span>
        );
      case "rejected":
        return (
          <span className={`${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400`}>
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            Odrzucona
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400`}>
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
            Oczekująca
          </span>
        );
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600 dark:text-green-400";
    if (confidence >= 0.6) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const handleSave = () => {
    onUpdate(candidate.id, {
      front_text: editFront,
      back_text: editBack,
      isEdited: true,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditFront(candidate.front_text);
    setEditBack(candidate.back_text);
    setIsEditing(false);
  };

  const shouldShowModal = candidate.front_text.length > 200 || candidate.back_text.length > 500;

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      {/* Status */}
      <td className="py-3 px-4">{getStatusBadge(candidate.status)}</td>

      {/* Front text */}
      <td className="py-3 px-4">
        {isEditing ? (
          <input
            type="text"
            value={editFront}
            onChange={(e) => setEditFront(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            maxLength={200}
          />
        ) : (
          <div className="max-w-xs">
            <p className="text-gray-900 dark:text-white text-sm">{candidate.front_text}</p>
            {candidate.isEdited && <span className="text-xs text-blue-600 dark:text-blue-400">Edytowane</span>}
          </div>
        )}
      </td>

      {/* Back text */}
      <td className="py-3 px-4">
        {isEditing ? (
          <textarea
            value={editBack}
            onChange={(e) => setEditBack(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
            rows={3}
            maxLength={500}
          />
        ) : (
          <div className="max-w-xs">
            <p className="text-gray-900 dark:text-white text-sm">{candidate.back_text}</p>
            {candidate.isEdited && <span className="text-xs text-blue-600 dark:text-blue-400">Edytowane</span>}
          </div>
        )}
      </td>

      {/* Confidence */}
      <td className="py-3 px-4">
        <span className={`font-medium ${getConfidenceColor(candidate.confidence)}`}>
          {(candidate.confidence * 100).toFixed(0)}%
        </span>
      </td>

      {/* Actions - tylko dla zalogowanych */}
      <td className="py-3 px-4">
        {isLoggedIn ? (
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <Button
                  onClick={handleSave}
                  size="sm"
                  variant="outline"
                  className="text-green-600 border-green-300 hover:bg-green-50"
                >
                  Zapisz
                </Button>
                <Button
                  onClick={handleCancel}
                  size="sm"
                  variant="outline"
                  className="text-gray-600 border-gray-300 hover:bg-gray-50"
                >
                  Anuluj
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => setIsEditing(true)}
                  size="sm"
                  variant="outline"
                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                >
                  Edytuj
                </Button>

                {shouldShowModal && (
                  <Button
                    onClick={() => onEdit(candidate)}
                    size="sm"
                    variant="outline"
                    className="text-purple-600 border-purple-300 hover:bg-purple-50"
                  >
                    Modal
                  </Button>
                )}

                <Button
                  onClick={() =>
                    onToggleStatus(candidate.id, candidate.status === "accepted" ? "rejected" : "accepted")
                  }
                  size="sm"
                  variant={candidate.status === "accepted" ? "outline" : "default"}
                  className={
                    candidate.status === "accepted"
                      ? "text-red-600 border-red-300 hover:bg-red-50"
                      : "text-white bg-green-600 hover:bg-green-700"
                  }
                >
                  {candidate.status === "accepted" ? "Odrzuć" : "Akceptuj"}
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground text-center">Tylko podgląd</div>
        )}
      </td>
    </tr>
  );
}
