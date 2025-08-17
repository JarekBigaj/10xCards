import React from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { X } from "lucide-react";
import type { FlashcardFilters as FlashcardFiltersType } from "../../lib/hooks/useFlashcardsView";

interface FlashcardFiltersProps {
  filters: FlashcardFiltersType;
  onChange: (filters: FlashcardFiltersType) => void;
  onReset: () => void;
}

export function FlashcardFilters({ filters, onChange, onReset }: FlashcardFiltersProps) {
  const updateFilter = (key: keyof FlashcardFiltersType, value: any) => {
    onChange({ ...filters, [key]: value });
  };

  const clearFilter = (key: keyof FlashcardFiltersType) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onChange(newFilters);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Zaawansowane filtry</h3>
        <Button variant="ghost" size="sm" onClick={onReset}>
          <X className="w-4 h-4 mr-1" />
          Wyczyść wszystkie
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Source filter */}
        <div className="space-y-2">
          <label htmlFor="source-filter" className="text-sm font-medium text-foreground">
            Źródło
          </label>
          <Select value={filters.source || ""} onValueChange={(value) => updateFilter("source", value || undefined)}>
            <SelectTrigger id="source-filter">
              <SelectValue placeholder="Wszystkie źródła" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Wszystkie źródła</SelectItem>
              <SelectItem value="ai-full">AI (pełne)</SelectItem>
              <SelectItem value="ai-edit">AI (edytowane)</SelectItem>
              <SelectItem value="manual">Ręczne</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date range filters */}
        <div className="space-y-2">
          <label htmlFor="created-after-filter" className="text-sm font-medium text-foreground">
            Utworzone po
          </label>
          <Input
            id="created-after-filter"
            type="date"
            value={filters.created_after || ""}
            onChange={(e) => updateFilter("created_after", e.target.value || undefined)}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="created-before-filter" className="text-sm font-medium text-foreground">
            Utworzone przed
          </label>
          <Input
            id="created-before-filter"
            type="date"
            value={filters.created_before || ""}
            onChange={(e) => updateFilter("created_before", e.target.value || undefined)}
          />
        </div>

        {/* Difficulty range */}
        <div className="space-y-2">
          <label htmlFor="difficulty-min-filter" className="text-sm font-medium text-foreground">
            Trudność min
          </label>
          <Input
            id="difficulty-min-filter"
            type="number"
            min="0"
            max="5"
            step="0.1"
            value={filters.difficulty_min || ""}
            onChange={(e) => updateFilter("difficulty_min", e.target.value ? Number(e.target.value) : undefined)}
            placeholder="0.0"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="difficulty-max-filter" className="text-sm font-medium text-foreground">
            Trudność max
          </label>
          <Input
            id="difficulty-max-filter"
            type="number"
            min="0"
            max="5"
            step="0.1"
            value={filters.difficulty_max || ""}
            onChange={(e) => updateFilter("difficulty_max", e.target.value ? Number(e.target.value) : undefined)}
            placeholder="5.0"
          />
        </div>

        {/* Repetitions range */}
        <div className="space-y-2">
          <label htmlFor="reps-min-filter" className="text-sm font-medium text-foreground">
            Powtórki min
          </label>
          <Input
            id="reps-min-filter"
            type="number"
            min="0"
            value={filters.reps_min || ""}
            onChange={(e) => updateFilter("reps_min", e.target.value ? Number(e.target.value) : undefined)}
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="reps-max-filter" className="text-sm font-medium text-foreground">
            Powtórki max
          </label>
          <Input
            id="reps-max-filter"
            type="number"
            min="0"
            value={filters.reps_max || ""}
            onChange={(e) => updateFilter("reps_max", e.target.value ? Number(e.target.value) : undefined)}
            placeholder="100"
          />
        </div>
      </div>

      {/* Special filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="never-reviewed"
            checked={filters.never_reviewed || false}
            onCheckedChange={(checked) => updateFilter("never_reviewed", checked || undefined)}
          />
          <label htmlFor="never-reviewed" className="text-sm text-foreground">
            Nigdy nie przeglądane
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="due-only"
            checked={filters.due_only || false}
            onCheckedChange={(checked) => updateFilter("due_only", checked || undefined)}
          />
          <label htmlFor="due-only" className="text-sm text-foreground">
            Tylko do powtórki
          </label>
        </div>
      </div>

      {/* Active filters summary */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(filters).map(([key, value]) => {
          if (value === undefined || value === null || value === "") return null;

          let displayValue = String(value);
          let displayKey = key;

          switch (key) {
            case "source":
              displayKey = "Źródło";
              if (value === "ai-full") displayValue = "AI (pełne)";
              else if (value === "ai-edit") displayValue = "AI (edytowane)";
              else if (value === "manual") displayValue = "Ręczne";
              break;
            case "created_after":
              displayKey = "Po";
              break;
            case "created_before":
              displayKey = "Przed";
              break;
            case "difficulty_min":
              displayKey = "Trudność ≥";
              break;
            case "difficulty_max":
              displayKey = "Trudność ≤";
              break;
            case "reps_min":
              displayKey = "Powtórki ≥";
              break;
            case "reps_max":
              displayKey = "Powtórki ≤";
              break;
            case "never_reviewed":
              displayKey = "Nigdy nie przeglądane";
              displayValue = "";
              break;
            case "due_only":
              displayKey = "Do powtórki";
              displayValue = "";
              break;
          }

          return (
            <div key={key} className="flex items-center bg-primary/10 text-primary px-2 py-1 rounded text-xs">
              <span>{displayKey}</span>
              {displayValue && <span className="ml-1">: {displayValue}</span>}
              <button
                onClick={() => clearFilter(key as keyof FlashcardFiltersType)}
                className="ml-1 hover:bg-primary/20 rounded p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
