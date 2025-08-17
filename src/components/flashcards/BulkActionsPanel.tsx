import React from "react";
import { Button } from "../ui/button";
import { Trash2, X } from "lucide-react";

interface BulkActionsPanelProps {
  selectedCount: number;
  onDelete: () => void;
  onDeselect: () => void;
  isDeleting: boolean;
}

export function BulkActionsPanel({ selectedCount, onDelete, onDeselect, isDeleting }: BulkActionsPanelProps) {
  const getSelectedCountText = (count: number) => {
    if (count === 1) return `${count} fiszka zaznaczona`;
    if (count < 5) return `${count} fiszki zaznaczone`;
    return `${count} fiszek zaznaczonych`;
  };

  return (
    <div className="bg-primary/5 border-b border-primary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-primary">{getSelectedCountText(selectedCount)}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDeselect}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4 mr-1" />
              Odznacz wszystkie
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              disabled={isDeleting}
              className="flex items-center"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              {isDeleting ? "Usuwanie..." : "Usuń zaznaczone"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
