"use client";

import Image from "next/image";
import { useLocale } from "next-intl";
import type { MatchPlayerAppearance, Player } from "@/types";
import {
  getAvailabilityMeta,
  isExpectedToPlay,
} from "@/lib/player-availability";
import { buildEventChips } from "@/lib/match-events";
import { cn } from "@/lib/utils";

interface MatchPlayerChipProps {
  appearance: MatchPlayerAppearance;
  player?: Player;
  onPlayerClick?: (playerId: string) => void;
  /** compact = Match-Card, full = Modal */
  variant?: "compact" | "full";
}

/**
 * Klickbarer Spieler-Chip im Match:
 * Foto, Name, Verfügbarkeit, Tore / Karten / Auswechslung
 */
export function MatchPlayerChip({
  appearance,
  player,
  onPlayerClick,
  variant = "compact",
}: MatchPlayerChipProps) {
  const locale = useLocale() === "en" ? "en" : "de";
  const isDe = locale === "de";
  const playing = isExpectedToPlay(player?.availability);
  const meta = getAvailabilityMeta(player?.availability);
  const events = buildEventChips(appearance, locale);
  const img = player?.imageUrl;

  const content = (
    <>
      {img ? (
        <Image
          src={img}
          alt=""
          width={variant === "full" ? 36 : 22}
          height={variant === "full" ? 36 : 22}
          className={cn(
            "shrink-0 rounded-full bg-secondary object-cover",
            variant === "full" ? "h-9 w-9" : "h-5 w-5",
            !playing && "grayscale"
          )}
          unoptimized
        />
      ) : null}

      <span className={cn("min-w-0 truncate font-medium", !playing && "opacity-70")}>
        {appearance.playerName.split(" ").slice(-1)[0] || appearance.playerName}
      </span>

      {/* Verfügbarkeit (Urlaub etc.) */}
      {!playing && (
        <span
          className="shrink-0 text-[10px] font-semibold text-sky-300"
          title={
            player?.availabilityNote ||
            (isDe ? meta.labelDe : meta.labelEn)
          }
        >
          {meta.emoji}
        </span>
      )}

      {/* Match-Events */}
      {events.map((e) => (
        <span
          key={e.key}
          title={e.title}
          className={cn("shrink-0 text-[11px] font-semibold tabular-nums", e.className)}
        >
          {e.label}
        </span>
      ))}
    </>
  );

  const className = cn(
    "inline-flex max-w-full items-center gap-1.5 rounded-full border px-1.5 py-0.5 text-xs transition-colors",
    playing
      ? "border-border bg-secondary/40 hover:border-primary/50 hover:bg-secondary"
      : "border-sky-500/40 bg-sky-500/10 opacity-80",
    onPlayerClick && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    variant === "full" && "w-full rounded-xl border-border px-3 py-2.5 text-sm"
  );

  if (onPlayerClick) {
    return (
      <button
        type="button"
        className={className}
        onClick={() => onPlayerClick(appearance.playerId)}
        title={
          isDe
            ? `${appearance.playerName} – Profil & nächste Spiele`
            : `${appearance.playerName} – profile & upcoming matches`
        }
      >
        {content}
        {variant === "full" && (
          <span className="ml-auto shrink-0 text-[11px] text-primary font-semibold">
            {isDe ? "Spiele →" : "Matches →"}
          </span>
        )}
      </button>
    );
  }

  return <span className={className}>{content}</span>;
}
