import { useState, useCallback, useEffect, useMemo } from "react";
import type {
  FlashcardDto,
  FlashcardStats,
  ExtendedFlashcardListQuery,
  FlashcardsListResponse,
  FlashcardStatsResponse,
  BulkDeleteRequest,
  BulkUpdateRequest,
  CreateFlashcardRequest,
  UpdateFlashcardRequest,
  BulkDeleteResponse,
  BulkUpdateResponse,
  FlashcardResponse,
} from "../../types";

// Types for the hook
export interface FlashcardFilters {
  search?: string;
  source?: "ai-full" | "ai-edit" | "manual";
  created_after?: string;
  created_before?: string;
  difficulty_min?: number;
  difficulty_max?: number;
  reps_min?: number;
  reps_max?: number;
  never_reviewed?: boolean;
  due_only?: boolean;
}

export interface SortConfig {
  field: "created_at" | "due" | "difficulty" | "front_text" | "source";
  order: "asc" | "desc";
}

export interface FlashcardsViewState {
  // Data
  flashcards: FlashcardDto[];
  stats: FlashcardStats | null;

  // UI State
  selectedIds: Set<string>;
  currentPage: number;
  filters: FlashcardFilters;
  searchQuery: string;
  sortConfig: SortConfig;
  viewMode: "table" | "cards";

  // Loading states
  isLoading: boolean;
  isDeleting: boolean;
  isBulkDeleting: boolean;
  isUpdating: boolean;

  // Modal states
  isCreateModalOpen: boolean;
  editingFlashcard: FlashcardDto | null;
  deletingFlashcard: FlashcardDto | null;

  // Pagination
  totalCount: number;
  totalPages: number;
  limit: number;

  // Error states
  error: string | null;
}

const defaultFilters: FlashcardFilters = {};

const defaultSortConfig: SortConfig = {
  field: "created_at",
  order: "desc",
};

const initialState: FlashcardsViewState = {
  flashcards: [],
  stats: null,
  selectedIds: new Set(),
  currentPage: 1,
  filters: defaultFilters,
  searchQuery: "",
  sortConfig: defaultSortConfig,
  viewMode: "table",
  isLoading: false,
  isDeleting: false,
  isBulkDeleting: false,
  isUpdating: false,
  isCreateModalOpen: false,
  editingFlashcard: null,
  deletingFlashcard: null,
  totalCount: 0,
  totalPages: 0,
  limit: 20,
  error: null,
};

export function useFlashcardsView(initialFlashcards?: FlashcardDto[], initialStats?: FlashcardStats) {
  const [state, setState] = useState<FlashcardsViewState>(() => ({
    ...initialState,
    flashcards: initialFlashcards || [],
    stats: initialStats || null,
  }));

  // Load flashcards with current filters
  const loadFlashcards = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const queryParams = new URLSearchParams();

      // Basic pagination
      queryParams.set("page", state.currentPage.toString());
      queryParams.set("limit", state.limit.toString());
      queryParams.set("sort", state.sortConfig.field);
      queryParams.set("order", state.sortConfig.order);

      // Extended search and filters
      if (state.searchQuery) queryParams.set("search", state.searchQuery);
      if (state.filters.source) queryParams.set("source", state.filters.source);
      if (state.filters.created_after) queryParams.set("created_after", state.filters.created_after);
      if (state.filters.created_before) queryParams.set("created_before", state.filters.created_before);
      if (state.filters.difficulty_min !== undefined)
        queryParams.set("difficulty_min", state.filters.difficulty_min.toString());
      if (state.filters.difficulty_max !== undefined)
        queryParams.set("difficulty_max", state.filters.difficulty_max.toString());
      if (state.filters.reps_min !== undefined) queryParams.set("reps_min", state.filters.reps_min.toString());
      if (state.filters.reps_max !== undefined) queryParams.set("reps_max", state.filters.reps_max.toString());
      if (state.filters.never_reviewed) queryParams.set("never_reviewed", "true");
      if (state.filters.due_only) queryParams.set("due_only", "true");

      const response = await fetch(`/api/flashcards?${queryParams}`);

      if (!response.ok) {
        throw new Error("Failed to load flashcards");
      }

      const data: FlashcardsListResponse = await response.json();

      setState((prev) => ({
        ...prev,
        flashcards: data.data.flashcards,
        totalCount: data.data.pagination.total_count,
        totalPages: data.data.pagination.total_pages,
        currentPage: data.data.pagination.current_page,
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to load flashcards",
      }));
    }
  }, [state.currentPage, state.limit, state.sortConfig, state.searchQuery, state.filters]);

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const response = await fetch("/api/flashcards/stats");

      if (!response.ok) {
        throw new Error("Failed to load stats");
      }

      const data: FlashcardStatsResponse = await response.json();

      setState((prev) => ({
        ...prev,
        stats: data.data.stats,
      }));
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  }, []);

  // Create flashcard
  const createFlashcard = useCallback(
    async (request: CreateFlashcardRequest) => {
      setState((prev) => ({ ...prev, isUpdating: true, error: null }));

      try {
        const response = await fetch("/api/flashcards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ flashcards: [request] }),
        });

        if (!response.ok) {
          throw new Error("Failed to create flashcard");
        }

        setState((prev) => ({ ...prev, isUpdating: false, isCreateModalOpen: false }));
        await loadFlashcards();
        await loadStats();
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isUpdating: false,
          error: error instanceof Error ? error.message : "Failed to create flashcard",
        }));
      }
    },
    [loadFlashcards, loadStats]
  );

  // Update flashcard
  const updateFlashcard = useCallback(
    async (id: string, request: UpdateFlashcardRequest) => {
      setState((prev) => ({ ...prev, isUpdating: true, error: null }));

      try {
        const response = await fetch(`/api/flashcards/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          throw new Error("Failed to update flashcard");
        }

        const data: FlashcardResponse = await response.json();

        setState((prev) => ({
          ...prev,
          flashcards: prev.flashcards.map((f) => (f.id === id ? data.data : f)),
          editingFlashcard: null,
          isUpdating: false,
        }));

        await loadStats();
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isUpdating: false,
          error: error instanceof Error ? error.message : "Failed to update flashcard",
        }));
      }
    },
    [loadStats]
  );

  // Delete flashcard
  const deleteFlashcard = useCallback(
    async (id: string) => {
      setState((prev) => ({ ...prev, isDeleting: true, error: null }));

      try {
        const response = await fetch(`/api/flashcards/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete flashcard");
        }

        setState((prev) => ({
          ...prev,
          flashcards: prev.flashcards.filter((f) => f.id !== id),
          deletingFlashcard: null,
          isDeleting: false,
          selectedIds: new Set([...prev.selectedIds].filter((selectedId) => selectedId !== id)),
        }));

        await loadStats();
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isDeleting: false,
          error: error instanceof Error ? error.message : "Failed to delete flashcard",
        }));
      }
    },
    [loadStats]
  );

  // Bulk delete
  const bulkDelete = useCallback(
    async (ids: Set<string>) => {
      setState((prev) => ({ ...prev, isBulkDeleting: true, error: null }));

      try {
        const request: BulkDeleteRequest = {
          flashcard_ids: Array.from(ids),
        };

        const response = await fetch("/api/flashcards/bulk", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          throw new Error("Failed to delete flashcards");
        }

        const data: BulkDeleteResponse = await response.json();

        setState((prev) => ({
          ...prev,
          selectedIds: new Set(),
          isBulkDeleting: false,
        }));

        await loadFlashcards();
        await loadStats();
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isBulkDeleting: false,
          error: error instanceof Error ? error.message : "Failed to delete flashcards",
        }));
      }
    },
    [loadFlashcards, loadStats]
  );

  // Selection management
  const toggleSelection = useCallback((id: string) => {
    setState((prev) => {
      const newSelection = new Set(prev.selectedIds);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      return { ...prev, selectedIds: newSelection };
    });
  }, []);

  const selectAll = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedIds: new Set(prev.flashcards.map((f) => f.id)),
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setState((prev) => ({ ...prev, selectedIds: new Set() }));
  }, []);

  // Filter management
  const setFilters = useCallback((newFilters: FlashcardFilters) => {
    setState((prev) => ({
      ...prev,
      filters: newFilters,
      currentPage: 1, // Reset to first page when filtering
    }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setState((prev) => ({
      ...prev,
      searchQuery: query,
      currentPage: 1, // Reset to first page when searching
    }));
  }, []);

  const setSortConfig = useCallback((config: SortConfig) => {
    setState((prev) => ({ ...prev, sortConfig: config }));
  }, []);

  const setPage = useCallback((page: number) => {
    setState((prev) => ({ ...prev, currentPage: page }));
  }, []);

  // Modal management
  const openCreateModal = useCallback(() => {
    setState((prev) => ({ ...prev, isCreateModalOpen: true }));
  }, []);

  const closeCreateModal = useCallback(() => {
    setState((prev) => ({ ...prev, isCreateModalOpen: false }));
  }, []);

  const openEditModal = useCallback((flashcard: FlashcardDto) => {
    setState((prev) => ({ ...prev, editingFlashcard: flashcard }));
  }, []);

  const closeEditModal = useCallback(() => {
    setState((prev) => ({ ...prev, editingFlashcard: null }));
  }, []);

  const openDeleteModal = useCallback((flashcard: FlashcardDto) => {
    setState((prev) => ({ ...prev, deletingFlashcard: flashcard }));
  }, []);

  const closeDeleteModal = useCallback(() => {
    setState((prev) => ({ ...prev, deletingFlashcard: null }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const setViewMode = useCallback((mode: "table" | "cards") => {
    setState((prev) => ({ ...prev, viewMode: mode }));
  }, []);

  // Computed values
  const hasActiveFilters = useMemo(() => {
    return Object.values(state.filters).some((value) => value !== undefined && value !== null && value !== "");
  }, [state.filters]);

  const filteredFlashcards = useMemo(() => {
    return state.flashcards; // Server-side filtering
  }, [state.flashcards]);

  // Load data on filter/search/sort changes
  useEffect(() => {
    loadFlashcards();
  }, [loadFlashcards]);

  // Load stats on mount
  useEffect(() => {
    if (!state.stats) {
      loadStats();
    }
  }, [loadStats, state.stats]);

  return {
    state,
    computed: {
      hasActiveFilters,
      filteredFlashcards,
    },
    actions: {
      loadFlashcards,
      loadStats,
      createFlashcard,
      updateFlashcard,
      deleteFlashcard,
      bulkDelete,
      toggleSelection,
      selectAll,
      clearSelection,
      setFilters,
      setSearchQuery,
      setSortConfig,
      setPage,
      openCreateModal,
      closeCreateModal,
      openEditModal,
      closeEditModal,
      openDeleteModal,
      closeDeleteModal,
      clearError,
      setViewMode,
    },
  };
}
