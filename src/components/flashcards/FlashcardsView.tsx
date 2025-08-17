import React from "react";
import { useFlashcardsView } from "../../lib/hooks/useFlashcardsView";
import { FlashcardsHeader } from "./FlashcardsHeader";
import { FlashcardsToolbar } from "./FlashcardsToolbar";
import { BulkActionsPanel } from "./BulkActionsPanel";
import { FlashcardsTable } from "./FlashcardsTable";
import { FlashcardsPagination } from "./FlashcardsPagination";
import { EmptyState } from "./EmptyState";
import { CreateFlashcardModal } from "./CreateFlashcardModal";
import { EditFlashcardModal } from "./EditFlashcardModal";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import type { FlashcardDto, FlashcardStats } from "../../types";

interface FlashcardsViewProps {
  initialFlashcards?: FlashcardDto[];
  initialStats?: FlashcardStats;
}

export function FlashcardsView({ initialFlashcards, initialStats }: FlashcardsViewProps) {
  const { state, computed, actions } = useFlashcardsView(initialFlashcards, initialStats);

  return (
    <div className="min-h-screen bg-background">
      <FlashcardsHeader
        totalCount={computed.filteredFlashcards.length}
        selectedCount={state.selectedIds.size}
        onCreateNew={actions.openCreateModal}
        stats={state.stats}
      />

      <FlashcardsToolbar
        searchQuery={state.searchQuery}
        onSearchChange={actions.setSearchQuery}
        filters={state.filters}
        onFiltersChange={actions.setFilters}
        sortConfig={state.sortConfig}
        onSortChange={actions.setSortConfig}
        viewMode={state.viewMode}
        onViewModeChange={actions.setViewMode}
      />

      {state.selectedIds.size > 0 && (
        <BulkActionsPanel
          selectedCount={state.selectedIds.size}
          onDelete={() => actions.bulkDelete(state.selectedIds)}
          onDeselect={actions.clearSelection}
          isDeleting={state.isBulkDeleting}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {state.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Wystąpił błąd</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{state.error}</p>
                </div>
                <div className="mt-3">
                  <button
                    type="button"
                    className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                    onClick={actions.clearError}
                  >
                    Zamknij
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {computed.filteredFlashcards.length === 0 ? (
          <EmptyState
            hasFilters={computed.hasActiveFilters}
            onClearFilters={() => actions.setFilters({})}
            onCreateNew={actions.openCreateModal}
            isLoading={state.isLoading}
          />
        ) : (
          <>
            <FlashcardsTable
              flashcards={computed.filteredFlashcards}
              selectedIds={state.selectedIds}
              onSelectionChange={actions.toggleSelection}
              onSelectAll={actions.selectAll}
              onEdit={actions.openEditModal}
              onDelete={actions.openDeleteModal}
              sortConfig={state.sortConfig}
              onSort={actions.setSortConfig}
              viewMode={state.viewMode}
              isLoading={state.isLoading}
            />

            {state.totalPages > 1 && (
              <FlashcardsPagination
                currentPage={state.currentPage}
                totalPages={state.totalPages}
                totalCount={state.totalCount}
                onPageChange={actions.setPage}
              />
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <CreateFlashcardModal
        isOpen={state.isCreateModalOpen}
        onClose={actions.closeCreateModal}
        onSuccess={actions.createFlashcard}
        isLoading={state.isUpdating}
      />

      <EditFlashcardModal
        isOpen={!!state.editingFlashcard}
        flashcard={state.editingFlashcard}
        onClose={actions.closeEditModal}
        onSuccess={(request) => {
          if (state.editingFlashcard) {
            actions.updateFlashcard(state.editingFlashcard.id, request);
          }
        }}
        isLoading={state.isUpdating}
      />

      <DeleteConfirmationModal
        isOpen={!!state.deletingFlashcard}
        flashcard={state.deletingFlashcard}
        onClose={actions.closeDeleteModal}
        onConfirm={() => {
          if (state.deletingFlashcard) {
            actions.deleteFlashcard(state.deletingFlashcard.id);
          }
        }}
        isLoading={state.isDeleting}
      />
    </div>
  );
}
