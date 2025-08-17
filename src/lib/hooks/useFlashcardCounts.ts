import { useState, useEffect } from "react";

interface FlashcardCounts {
  total: number;
  dueToday: number;
  loading: boolean;
  error: string | null;
}

export function useFlashcardCounts() {
  const [counts, setCounts] = useState<FlashcardCounts>({
    total: 0,
    dueToday: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchCounts() {
      try {
        setCounts((prev) => ({ ...prev, loading: true, error: null }));

        const response = await fetch("/api/flashcards/stats");

        if (!response.ok) {
          throw new Error("Failed to fetch flashcard stats");
        }

        const data = await response.json();

        if (data.success) {
          setCounts({
            total: data.data.stats.total_count || 0,
            dueToday: data.data.stats.due_today || 0,
            loading: false,
            error: null,
          });
        } else {
          throw new Error(data.error || "Failed to load stats");
        }
      } catch (error) {
        setCounts((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }));
      }
    }

    fetchCounts();

    // Refresh counts every 5 minutes
    const interval = setInterval(fetchCounts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return counts;
}
