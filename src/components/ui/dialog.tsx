"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  onClose?: () => void;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
      <button
        type="button"
        aria-label="Dialog schließen"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      {children}
    </div>
  );
}

export function DialogContent({
  className,
  title,
  description,
  onClose,
  children,
  ...props
}: DialogContentProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "dialog-title" : undefined}
      className={cn(
        "relative z-50 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border-2 border-border bg-card shadow-2xl sm:max-w-lg sm:rounded-2xl",
        className
      )}
      {...props}
    >
      {(title || onClose) && (
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0 space-y-1">
            {title && (
              <h2 id="dialog-title" className="text-lg font-semibold tracking-tight">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {onClose && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              aria-label="Schließen"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-5">{children}</div>
    </div>
  );
}
