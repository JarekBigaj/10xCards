import React, { useState } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import { Edit, Trash2 } from "lucide-react";
import { cn } from "../../lib/utils";
import type { FlashcardDto } from "../../types";

interface FlashcardRowProps {
  flashcard: FlashcardDto;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function FlashcardRow({ flashcard, isSelected, onSelect, onEdit, onDelete }: FlashcardRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const frontTextPreview = truncateText(flashcard.front_text, 60);
  const backTextPreview = truncateText(flashcard.back_text, 80);

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
    <tr
      className={cn(
        "group hover:bg-muted/25 transition-colors focus:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset",
        isSelected && "bg-primary/5"
      )}
      tabIndex={0}
      role="row"
      aria-selected={isSelected}
    >
      {/* Selection checkbox */}
      <td className="px-4 py-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelect}
          aria-label={`Zaznacz fiszkę: ${flashcard.front_text}`}
        />
      </td>

      {/* Front text */}
      <td className="px-4 py-3">
        <div className="max-w-xs">
          <p className="text-sm font-medium text-foreground break-words">{frontTextPreview}</p>
          {flashcard.front_text.length > 60 && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Zwiń" : "Rozwiń"}
            </Button>
          )}
          {isExpanded && <p className="mt-2 text-sm text-muted-foreground break-words">{flashcard.front_text}</p>}
        </div>
      </td>

      {/* Back text */}
      <td className="px-4 py-3">
        <div className="max-w-sm">
          <p className="text-sm text-muted-foreground break-words">{backTextPreview}</p>
        </div>
      </td>

      {/* Source */}
      <td className="px-4 py-3">
        <Badge variant={sourceInfo.variant} className="text-xs">
          {sourceInfo.label}
        </Badge>
      </td>

      {/* Due date */}
      <td className="px-4 py-3">
        <div className="flex items-center">
          <Badge variant={dueStatus.variant} className="text-xs">
            {dueStatus.label}
          </Badge>
        </div>
      </td>

      {/* Created at */}
      <td className="px-4 py-3 text-sm text-muted-foreground">{formatRelativeDate(flashcard.created_at)}</td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 w-8 p-0" title="Edytuj fiszkę">
            <Edit className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            title="Usuń fiszkę"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
