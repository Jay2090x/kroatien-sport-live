"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Inbox, RefreshCw } from "lucide-react";

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  className,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 px-4 py-10 text-center",
        className
      )}
      role="status"
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
        <Inbox className="h-5 w-5 text-muted-foreground" aria-hidden />
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4 h-8 text-xs"
          onClick={onAction}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
