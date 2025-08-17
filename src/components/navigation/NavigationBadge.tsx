import React from "react";
import { cn } from "../../lib/utils";

interface NavigationBadgeProps {
  count: number;
  variant?: "default" | "urgent";
  className?: string;
}

export function NavigationBadge({ count, variant = "default", className }: NavigationBadgeProps) {
  if (count <= 0) return null;

  return (
    <span
      className={cn(
        "ml-2 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium rounded-full",
        variant === "urgent"
          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
          : "bg-primary/10 text-primary",
        className
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
