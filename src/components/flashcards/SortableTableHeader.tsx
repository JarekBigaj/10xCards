import React from "react";
import { Button } from "../ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "../../lib/utils";
import type { SortConfig } from "../../lib/hooks/useFlashcardsView";

interface SortableTableHeaderProps {
  field: SortConfig["field"];
  sortConfig: SortConfig;
  onSort: (config: SortConfig) => void;
  children: React.ReactNode;
  className?: string;
}

export function SortableTableHeader({ field, sortConfig, onSort, children, className }: SortableTableHeaderProps) {
  const isActive = sortConfig.field === field;
  const currentOrder = isActive ? sortConfig.order : null;

  const handleClick = () => {
    if (isActive) {
      // Toggle order if this field is already active
      const newOrder = currentOrder === "asc" ? "desc" : "asc";
      onSort({ field, order: newOrder });
    } else {
      // Set this field as active with default desc order
      onSort({ field, order: "desc" });
    }
  };

  const getSortIcon = () => {
    if (!isActive) return <ArrowUpDown className="w-3 h-3" />;
    if (currentOrder === "asc") return <ArrowUp className="w-3 h-3" />;
    return <ArrowDown className="w-3 h-3" />;
  };

  return (
    <th className={cn("px-4 py-3", className)}>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-auto p-0 font-medium text-sm text-muted-foreground hover:text-foreground",
          isActive && "text-foreground"
        )}
        onClick={handleClick}
      >
        <span className="flex items-center">
          {children}
          <span className="ml-1">{getSortIcon()}</span>
        </span>
      </Button>
    </th>
  );
}
