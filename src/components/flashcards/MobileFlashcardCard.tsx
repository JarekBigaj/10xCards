import React, { useState } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import { Edit, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "../../lib/utils";
import type { FlashcardDto } from "../../types";

interface MobileFlashcardCardProps {
  flashcard: FlashcardDto;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function MobileFlashcardCard({ flashcard, isSelected, onSelect, onEdit, onDelete }: MobileFlashcardCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getDueStatus = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());

    const diffDays = Math.ceil((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: `${Math.abs(diffDays)}d przeterminowane`,
        variant: "destructive" as const,
      };
    } else if (diffDays === 0) {
      return {
        label: "Dziś",
        variant: "default" as const,
      };
    } else if (diffDays === 1) {
      return {
        label: "Jutro",
        variant: "secondary" as const,
      };
    } else if (diffDays <= 7) {
      return {
        label: `${diffDays}d`,
        variant: "secondary" as const,
      };
    } else {
      return {
        label: `${diffDays}d`,
        variant: "outline" as const,
      };
    }
  };

  const getSourceInfo = (source: string) => {
    switch (source) {
      case "ai-full":
        return {
          label: "AI",
          variant: "default" as const,
        };
      case "ai-edit":
        return {
          label: "AI (edit)",
          variant: "secondary" as const,
        };
      case "manual":
        return {
          label: "Manual",
          variant: "outline" as const,
        };
      default:
        return {
          label: source,
          variant: "outline" as const,
        };
    }
  };

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Dziś";
    if (diffDays === 1) return "Wczoraj";
    if (diffDays < 7) return `${diffDays}d temu`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}t temu`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}m temu`;
    return `${Math.floor(diffDays / 365)}r temu`;
  };

  const dueStatus = getDueStatus(flashcard.due);
  const sourceInfo = getSourceInfo(flashcard.source);

  return (
    <div
      className={cn(
        "bg-card border border-border rounded-lg p-4 space-y-3 touch-manipulation",
        isSelected && "ring-2 ring-primary ring-offset-2"
      )}
    >
      {/* Selection and main content */}
      <div className="flex items-start space-x-3">
        <Checkbox checked={isSelected} onCheckedChange={onSelect} className="mt-1 touch-manipulation scale-110" />

        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground break-words leading-relaxed">{flashcard.front_text}</p>

          {!isExpanded && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1 leading-relaxed">{flashcard.back_text}</p>
          )}

          {isExpanded && (
            <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap leading-relaxed">
              {flashcard.back_text}
            </p>
          )}
        </div>
      </div>

      {/* Meta information */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center space-x-2">
          <Badge variant={sourceInfo.variant} className="text-xs">
            {sourceInfo.label}
          </Badge>
          <span>{formatRelativeDate(flashcard.created_at)}</span>
        </div>

        <Badge variant={dueStatus.variant} className="text-xs">
          {dueStatus.label}
        </Badge>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs h-8 touch-manipulation"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3 h-3 mr-1" />
              Zwiń
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3 mr-1" />
              Rozwiń
            </>
          )}
        </Button>

        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={onEdit} className="text-xs h-8 px-3 touch-manipulation">
            <Edit className="w-3 h-3 mr-1" />
            Edytuj
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="text-xs h-8 px-3 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground touch-manipulation"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Usuń
          </Button>
        </div>
      </div>
    </div>
  );
}
