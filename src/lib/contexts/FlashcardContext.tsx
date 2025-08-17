import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from "react";
import type { FlashcardDto, FlashcardStats } from "../../types";

interface FlashcardContextValue {
  // Data
  flashcards: FlashcardDto[];
  stats: FlashcardStats | null;

  // Status
  isLoading: boolean;
  error: string | null;
  lastFetch: number;

  // Actions
  refreshFlashcards: () => Promise<void>;
  refreshStats: () => Promise<void>;
  optimisticUpdate: (id: string, updates: Partial<FlashcardDto>) => void;
  optimisticDelete: (id: string) => void;
  optimisticCreate: (flashcard: FlashcardDto) => void;

  // Cache management
  invalidateCache: () => void;
  shouldRefresh: () => boolean;
}

const FlashcardContext = createContext<FlashcardContextValue | null>(null);

interface FlashcardProviderProps {
  children: ReactNode;
  initialFlashcards?: FlashcardDto[];
  initialStats?: FlashcardStats;
}

export function FlashcardProvider({ children, initialFlashcards, initialStats }: FlashcardProviderProps) {
  const [flashcards, setFlashcards] = useState<FlashcardDto[]>(initialFlashcards || []);
  const [stats, setStats] = useState<FlashcardStats | null>(initialStats || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(Date.now());

  // Cache invalidation - refresh after 5 minutes
  const shouldRefresh = useCallback(() => {
    return Date.now() - lastFetch > 5 * 60 * 1000;
  }, [lastFetch]);

  const refreshFlashcards = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/flashcards?limit=50"); // Get more for global cache

      if (!response.ok) {
        throw new Error("Failed to fetch flashcards");
      }

      const data = await response.json();

      if (data.success) {
        setFlashcards(data.data.flashcards);
        setLastFetch(Date.now());
      } else {
        throw new Error(data.error || "Failed to load flashcards");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to refresh flashcards";
      setError(errorMessage);
      // eslint-disable-next-line no-console
      console.error("Failed to refresh flashcards:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const refreshStats = useCallback(async () => {
    try {
      const response = await fetch("/api/flashcards/stats");

      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }

      const data = await response.json();

      if (data.success) {
        setStats(data.data.stats);
      } else {
        throw new Error(data.error || "Failed to load stats");
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to refresh stats:", error);
      // Don't set error for stats as they're not critical
    }
  }, []);

  // Optimistic updates for immediate UI feedback
  const optimisticUpdate = useCallback((id: string, updates: Partial<FlashcardDto>) => {
    setFlashcards((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  }, []);

  const optimisticDelete = useCallback((id: string) => {
    setFlashcards((prev) => prev.filter((f) => f.id !== id));
    setStats((prev) => (prev ? { ...prev, total_count: Math.max(0, prev.total_count - 1) } : null));
  }, []);

  const optimisticCreate = useCallback((flashcard: FlashcardDto) => {
    setFlashcards((prev) => [flashcard, ...prev]);
    setStats((prev) =>
      prev
        ? {
            ...prev,
            total_count: prev.total_count + 1,
            by_source: {
              ...prev.by_source,
              [flashcard.source]: (prev.by_source[flashcard.source] || 0) + 1,
            },
          }
        : null
    );
  }, []);

  const invalidateCache = useCallback(() => {
    setLastFetch(0); // Force refresh on next check
  }, []);

  // Auto-refresh when cache is stale and component is focused
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const handleFocus = () => {
      if (shouldRefresh()) {
        refreshFlashcards();
        refreshStats();
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && shouldRefresh()) {
        refreshFlashcards();
        refreshStats();
      }
    };

    // Set up auto-refresh interval (every 5 minutes)
    if (flashcards.length > 0) {
      interval = setInterval(
        () => {
          if (!document.hidden && shouldRefresh()) {
            refreshFlashcards();
            refreshStats();
          }
        },
        5 * 60 * 1000
      );
    }

    // Listen for window focus and visibility changes
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (interval) clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [flashcards.length, shouldRefresh, refreshFlashcards, refreshStats]);

  const value = useMemo(
    () => ({
      flashcards,
      stats,
      isLoading,
      error,
      lastFetch,
      refreshFlashcards,
      refreshStats,
      optimisticUpdate,
      optimisticDelete,
      optimisticCreate,
      invalidateCache,
      shouldRefresh,
    }),
    [
      flashcards,
      stats,
      isLoading,
      error,
      lastFetch,
      refreshFlashcards,
      refreshStats,
      optimisticUpdate,
      optimisticDelete,
      optimisticCreate,
      invalidateCache,
      shouldRefresh,
    ]
  );

  return <FlashcardContext.Provider value={value}>{children}</FlashcardContext.Provider>;
}

export function useFlashcardContext() {
  const context = useContext(FlashcardContext);
  if (!context) {
    throw new Error("useFlashcardContext must be used within FlashcardProvider");
  }
  return context;
}

// Optional hook for components that might not have access to context
export function useOptionalFlashcardContext() {
  return useContext(FlashcardContext);
}
