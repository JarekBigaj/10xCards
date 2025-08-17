import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { FlashcardProvider } from "@/lib/contexts/FlashcardContext";
import type { Flashcard } from "@/types";

// Custom render function with providers
interface CustomRenderOptions extends RenderOptions {
  initialFlashcards?: Flashcard[];
}

export function renderWithProviders(ui: React.ReactElement, options: CustomRenderOptions = {}) {
  const { initialFlashcards = [], ...renderOptions } = options;

  function Wrapper({ children }: { children: React.ReactNode }) {
    return <FlashcardProvider initialFlashcards={initialFlashcards}>{children}</FlashcardProvider>;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything from testing-library
export * from "@testing-library/react";
export { renderWithProviders as render };
