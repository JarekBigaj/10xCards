import { useCallback, useEffect, useRef } from "react";
import type { FlashcardDto } from "../../types";

interface UseKeyboardNavigationProps {
  flashcards: FlashcardDto[];
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onSelectAll: () => void;
  onEdit: (flashcard: FlashcardDto) => void;
  onDelete: (flashcard: FlashcardDto) => void;
  isModalOpen: boolean;
}

export function useKeyboardNavigation({
  flashcards,
  selectedIds,
  onToggleSelection,
  onSelectAll,
  onEdit,
  onDelete,
  isModalOpen,
}: UseKeyboardNavigationProps) {
  const focusedRowIndex = useRef<number>(-1);
  const tableRef = useRef<HTMLTableElement>(null);

  const moveFocus = useCallback(
    (direction: "up" | "down") => {
      if (flashcards.length === 0) return;

      const currentIndex = focusedRowIndex.current;
      let newIndex: number;

      if (direction === "down") {
        newIndex = currentIndex < flashcards.length - 1 ? currentIndex + 1 : 0;
      } else {
        newIndex = currentIndex > 0 ? currentIndex - 1 : flashcards.length - 1;
      }

      focusedRowIndex.current = newIndex;

      // Update focus in DOM
      if (tableRef.current) {
        const rows = tableRef.current.querySelectorAll("tbody tr");
        const targetRow = rows[newIndex] as HTMLElement;
        if (targetRow) {
          targetRow.focus();
          targetRow.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }
    },
    [flashcards.length]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't handle keyboard events when modals are open
      if (isModalOpen) return;

      const target = event.target as HTMLElement;
      const isInputFocused = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      // Don't interfere with typing in inputs
      if (isInputFocused) return;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          moveFocus("down");
          break;

        case "ArrowUp":
          event.preventDefault();
          moveFocus("up");
          break;

        case " ":
        case "Spacebar":
          event.preventDefault();
          if (focusedRowIndex.current >= 0 && focusedRowIndex.current < flashcards.length) {
            const flashcard = flashcards[focusedRowIndex.current];
            onToggleSelection(flashcard.id);
          }
          break;

        case "Enter":
          event.preventDefault();
          if (focusedRowIndex.current >= 0 && focusedRowIndex.current < flashcards.length) {
            const flashcard = flashcards[focusedRowIndex.current];
            onEdit(flashcard);
          }
          break;

        case "Delete":
        case "Backspace":
          event.preventDefault();
          if (focusedRowIndex.current >= 0 && focusedRowIndex.current < flashcards.length) {
            const flashcard = flashcards[focusedRowIndex.current];
            onDelete(flashcard);
          }
          break;

        case "a":
        case "A":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            onSelectAll();
          }
          break;

        case "Escape":
          // Clear focus
          focusedRowIndex.current = -1;
          if (tableRef.current) {
            tableRef.current.focus();
          }
          break;

        default:
          break;
      }
    },
    [flashcards, isModalOpen, moveFocus, onToggleSelection, onEdit, onDelete, onSelectAll]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const setTableRef = useCallback((element: HTMLTableElement | null) => {
    tableRef.current = element;
  }, []);

  const getFocusedRowIndex = useCallback(() => focusedRowIndex.current, []);

  const setFocusedRowIndex = useCallback((index: number) => {
    focusedRowIndex.current = index;
  }, []);

  return {
    setTableRef,
    getFocusedRowIndex,
    setFocusedRowIndex,
  };
}
