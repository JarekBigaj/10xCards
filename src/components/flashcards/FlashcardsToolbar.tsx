import React, { useState } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Filter, ArrowUpDown, Table, Grid, Search } from "lucide-react";
import { cn } from "../../lib/utils";
import { FlashcardFilters as FlashcardFiltersComponent } from "./FlashcardFilters.js";
import type { FlashcardFilters as FlashcardFiltersType, SortConfig } from "../../lib/hooks/useFlashcardsView";

interface FlashcardsToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: FlashcardFiltersType;
  onFiltersChange: (filters: FlashcardFiltersType) => void;
  sortConfig: SortConfig;
  onSortChange: (config: SortConfig) => void;
  viewMode: "table" | "cards";
  onViewModeChange: (mode: "table" | "cards") => void;
}

export function FlashcardsToolbar({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  sortConfig,
  onSortChange,
  viewMode,
  onViewModeChange,
}: FlashcardsToolbarProps) {
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = () => {
    return Object.values(filters).some((value) => value !== undefined && value !== null && value !== "");
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter((value) => value !== undefined && value !== null && value !== "").length;
  };

  return (
    <div className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          {/* Search bar */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Szukaj w fiszkach..."
                className="pl-10 w-full"
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2">
            {/* Filters toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={cn("flex items-center", hasActiveFilters() && "border-primary bg-primary/5")}
            >
              <Filter className="w-4 h-4 mr-1" />
              Filtry
              {hasActiveFilters() && (
                <Badge variant="secondary" className="ml-2 h-5 px-1 text-xs">
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </Button>

            {/* Sort dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <ArrowUpDown className="w-4 h-4 mr-1" />
                  Sortuj
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onSortChange({ field: "created_at", order: "desc" })}>
                  Najnowsze
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSortChange({ field: "created_at", order: "asc" })}>
                  Najstarsze
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSortChange({ field: "due", order: "asc" })}>
                  Najbliższa powtórka
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSortChange({ field: "difficulty", order: "desc" })}>
                  Najtrudniejsze
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSortChange({ field: "front_text", order: "asc" })}>
                  Alfabetycznie
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* View mode toggle */}
            <div className="hidden sm:flex border border-border rounded-md">
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("table")}
                className="rounded-r-none"
              >
                <Table className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "cards" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("cards")}
                className="rounded-l-none"
              >
                <Grid className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Expandable filters panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-border">
            <FlashcardFiltersComponent
              filters={filters}
              onChange={onFiltersChange}
              onReset={() => onFiltersChange({})}
            />
          </div>
        )}
      </div>
    </div>
  );
}
