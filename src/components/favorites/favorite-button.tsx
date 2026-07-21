"use client";

import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFavorites } from "@/components/favorites/favorites-context";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FavoriteButtonProps {
  playerId: string;
  playerName?: string;
  className?: string;
  size?: "sm" | "md";
  stopPropagation?: boolean;
}

export function FavoriteButton({
  playerId,
  playerName,
  className,
  size = "sm",
  stopPropagation = true,
}: FavoriteButtonProps) {
  const t = useTranslations("Favorites");
  const { isFavorite, toggleFavorite } = useFavorites();
  const on = isFavorite(playerId);

  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? t("remove") : t("add")}
      title={on ? t("remove") : t("add")}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        size === "sm" ? "h-7 w-7" : "h-9 w-9",
        on
          ? "border-amber-500/50 bg-amber-500/15 text-amber-300"
          : "border-border bg-secondary/50 text-muted-foreground hover:border-amber-500/40 hover:text-amber-200",
        className
      )}
      onClick={(e) => {
        if (stopPropagation) {
          e.preventDefault();
          e.stopPropagation();
        }
        toggleFavorite(playerId);
        toast.success(
          on
            ? t("removedToast", { name: playerName || "" })
            : t("addedToast", { name: playerName || "" })
        );
      }}
    >
      <Star
        className={cn(size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4", on && "fill-current")}
      />
    </button>
  );
}
