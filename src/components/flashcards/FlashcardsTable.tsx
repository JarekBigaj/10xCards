import React from "react";
import { Checkbox } from "../ui/checkbox";
import { FlashcardRow } from "./FlashcardRow";
import { MobileFlashcardCard } from "./MobileFlashcardCard";
import { SortableTableHeader } from "./SortableTableHeader";
import { Skeleton } from "../ui/skeleton";
import { useKeyboardNavigation } from "../../lib/hooks/useKeyboardNavigation";
import type { FlashcardDto } from "../../types";
import type { SortConfig } from "../../lib/hooks/useFlashcardsView";

interface FlashcardsTableProps {
  flashcards: FlashcardDto[];
  selectedIds: Set<string>;
  onSelectionChange: (id: string) => void;
  onSelectAll: () => void;
  onEdit: (flashcard: FlashcardDto) => void;
  onDelete: (flashcard: FlashcardDto) => void;
  sortConfig: SortConfig;
  onSort: (config: SortConfig) => void;
  viewMode: "table" | "cards";
  isLoading: boolean;
}

export function FlashcardsTable({
  flashcards,
  selectedIds,
  onSelectionChange,
  onSelectAll,
  onEdit,
  onDelete,
  sortConfig,
  onSort,
  viewMode,
  isLoading,
}: FlashcardsTableProps) {
  const isAllSelected = flashcards.length > 0 && flashcards.every((f) => selectedIds.has(f.id));
  const isPartiallySelected = flashcards.some((f) => selectedIds.has(f.id)) && !isAllSelected;

  const { setTableRef } = useKeyboardNavigation({
    flashcards,
    selectedIds,
    onToggleSelection: onSelectionChange,
    onSelectAll,
    onEdit,
    onDelete,
    isModalOpen: false, // We'll pass this from parent later if needed
  });

  const handleSelectAll = () => {
    onSelectAll();
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="p-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (viewMode === "cards") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {flashcards.map((flashcard) => (
          <MobileFlashcardCard
            key={flashcard.id}
            flashcard={flashcard}
            isSelected={selectedIds.has(flashcard.id)}
            onSelect={() => onSelectionChange(flashcard.id)}
            onEdit={() => onEdit(flashcard)}
            onDelete={() => onDelete(flashcard)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table
          ref={setTableRef}
          className="w-full"
          role="table"
          aria-label="Lista fiszek użytkownika"
          aria-describedby="flashcards-help"
        >
          <thead className="bg-muted/50">
            <tr>
              <th className="w-12 px-4 py-3">
                <Checkbox
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isPartiallySelected;
                  }}
                  onCheckedChange={handleSelectAll}
                  aria-label="Zaznacz wszystkie"
                />
              </th>

              <SortableTableHeader field="front_text" sortConfig={sortConfig} onSort={onSort} className="text-left">
                Przód
              </SortableTableHeader>

              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Tył</th>

              <SortableTableHeader field="source" sortConfig={sortConfig} onSort={onSort} className="w-24">
                Źródło
              </SortableTableHeader>

              <SortableTableHeader field="due" sortConfig={sortConfig} onSort={onSort} className="w-32">
                Powtórka
              </SortableTableHeader>

              <SortableTableHeader field="created_at" sortConfig={sortConfig} onSort={onSort} className="w-32">
                Utworzono
              </SortableTableHeader>

              <th className="w-24 px-4 py-3 text-right text-sm font-medium text-muted-foreground">Akcje</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {flashcards.map((flashcard) => (
              <FlashcardRow
                key={flashcard.id}
                flashcard={flashcard}
                isSelected={selectedIds.has(flashcard.id)}
                onSelect={() => onSelectionChange(flashcard.id)}
                onEdit={() => onEdit(flashcard)}
                onDelete={() => onDelete(flashcard)}
              />
            ))}
          </tbody>
        </table>

        {/* Screen reader help text */}
        <div id="flashcards-help" className="sr-only">
          Tabela zawiera {flashcards.length} fiszek. Użyj strzałek do nawigacji, spacji do zaznaczania, Enter do edycji,
          Delete do usuwania. Ctrl+A zaznacza wszystkie.
        </div>
      </div>
    </div>
  );
}
