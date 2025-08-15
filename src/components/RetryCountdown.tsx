import React, { useState, useEffect } from "react";

interface RetryCountdownProps {
  retryAfter: number;
  onRetry: () => void;
}

export function RetryCountdown({ retryAfter, onRetry }: RetryCountdownProps) {
  const [timeLeft, setTimeLeft] = useState(Math.ceil(retryAfter / 1000));

  useEffect(() => {
    if (timeLeft <= 0) {
      onRetry();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, onRetry]);

  if (timeLeft <= 0) {
    return <div className="mt-2 text-xs text-green-600 dark:text-green-400">Ponawiam...</div>;
  }

  return (
    <div className="mt-2 text-xs text-red-600 dark:text-red-400">Automatyczne ponowienie za {timeLeft} sekund</div>
  );
}
