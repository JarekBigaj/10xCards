import React from "react";

interface CharacterCounterProps {
  current: number;
  min: number;
  max: number;
}

export function CharacterCounter({ current, min, max }: CharacterCounterProps) {
  const getColorClass = () => {
    if (current < min) {
      return "text-red-500 dark:text-red-400";
    }
    if (current > max) {
      return "text-red-500 dark:text-red-400";
    }
    if (current >= min && current <= max) {
      return "text-green-500 dark:text-green-400";
    }
    return "text-gray-500 dark:text-gray-400";
  };

  const getProgressPercentage = () => {
    const range = max - min;
    const progress = current - min;
    return Math.max(0, Math.min(100, (progress / range) * 100));
  };

  return (
    <div className="flex items-center space-x-2">
      <span id="char-counter" className={`text-sm font-medium ${getColorClass()}`} aria-live="polite">
        {current} / {max}
      </span>

      {/* Progress bar */}
      <div className="w-16 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            current < min ? "bg-red-500" : current > max ? "bg-red-500" : "bg-green-500"
          }`}
          style={{ width: `${getProgressPercentage()}%` }}
        />
      </div>

      {/* Status indicator */}
      {current < min && <span className="text-xs text-red-500 dark:text-red-400">Min {min}</span>}
      {current > max && <span className="text-xs text-red-500 dark:text-red-400">Max {max}</span>}
    </div>
  );
}
