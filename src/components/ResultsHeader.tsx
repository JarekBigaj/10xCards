import React from "react";

interface ResultsHeaderProps {
  totalCount: number;
  acceptedCount: number;
  rejectedCount: number;
  pendingCount: number;
}

export function ResultsHeader({ totalCount, acceptedCount, rejectedCount, pendingCount }: ResultsHeaderProps) {
  const acceptanceRate = totalCount > 0 ? ((acceptedCount / totalCount) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Wygenerowano {totalCount} kandydatów</h3>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Przejrzyj i wybierz fiszki do zapisania</p>
      </div>

      {/* Statistics cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalCount}</div>
          <div className="text-sm text-blue-600 dark:text-blue-400">Wszystkie</div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{acceptedCount}</div>
          <div className="text-sm text-green-600 dark:text-green-400">Zaakceptowane</div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{rejectedCount}</div>
          <div className="text-sm text-red-600 dark:text-red-400">Odrzucone</div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{pendingCount}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Oczekujące</div>
        </div>
      </div>

      {/* Acceptance rate */}
      <div className="text-center">
        <div className="inline-flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Wskaźnik akceptacji:</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{acceptanceRate}%</span>
        </div>
      </div>
    </div>
  );
}
