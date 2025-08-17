import React from "react";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import type { FlashcardStats } from "../../types";

interface FlashcardsHeaderProps {
  totalCount: number;
  selectedCount: number;
  onCreateNew: () => void;
  stats: FlashcardStats | null;
}

export function FlashcardsHeader({ totalCount, selectedCount, onCreateNew, stats }: FlashcardsHeaderProps) {
  const getFlashcardCountText = (count: number) => {
    if (count === 1) return "fiszka";
    if (count < 5) return "fiszki";
    return "fiszek";
  };

  return (
    <div className="bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Moje fiszki</h1>
            <p className="mt-1 text-muted-foreground">
              {totalCount} {getFlashcardCountText(totalCount)}
              {selectedCount > 0 && <span className="ml-2 text-primary">• {selectedCount} zaznaczonych</span>}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Quick stats for desktop */}
            {stats && (
              <div className="hidden lg:flex items-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                  <span>AI: {(stats.by_source["ai-full"] || 0) + (stats.by_source["ai-edit"] || 0)}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                  <span>Manual: {stats.by_source.manual || 0}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-2" />
                  <span>Do powtórki: {stats.due_today || 0}</span>
                </div>
              </div>
            )}

            <Button onClick={onCreateNew} className="flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Dodaj fiszkę</span>
              <span className="sm:hidden">Dodaj</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
