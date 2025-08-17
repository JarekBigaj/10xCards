import React from "react";
import { Button } from "../ui/button";
import { Plus, Filter, Loader2 } from "lucide-react";

interface EmptyStateProps {
  hasFilters: boolean;
  onClearFilters: () => void;
  onCreateNew: () => void;
  isLoading: boolean;
}

export function EmptyState({ hasFilters, onClearFilters, onCreateNew, isLoading }: EmptyStateProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Ładowanie fiszek...</h3>
        <p className="text-muted-foreground">Proszę czekać</p>
      </div>
    );
  }

  if (hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Filter className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Brak wyników</h3>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          Nie znaleziono fiszek odpowiadających aktualnym filtrom. Spróbuj zmienić kryteria wyszukiwania lub wyczyść
          filtry.
        </p>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={onClearFilters}>
            Wyczyść filtry
          </Button>
          <Button onClick={onCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            Dodaj pierwszą fiszkę
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
        <Plus className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Brak fiszek</h3>
      <p className="text-muted-foreground mb-6 text-center max-w-md">
        Nie masz jeszcze żadnych fiszek. Rozpocznij naukę tworząc pierwszą fiszkę lub wygeneruj je automatycznie za
        pomocą AI.
      </p>
      <div className="flex space-x-3">
        <Button onClick={onCreateNew}>
          <Plus className="w-4 h-4 mr-2" />
          Dodaj pierwszą fiszkę
        </Button>
        <Button variant="outline" asChild>
          <a href="/generate">Generuj fiszki AI</a>
        </Button>
      </div>
    </div>
  );
}
