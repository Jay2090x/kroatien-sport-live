"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { MessageSquareWarning, Send } from "lucide-react";
import type { Player, PlayerAvailability } from "@/types";
import {
  AVAILABILITY_OPTIONS,
  getAvailabilityLabel,
  getAvailabilityMeta,
} from "@/lib/player-availability";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { STORAGE_KEYS, safeJsonParse } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface StatusSuggestion {
  id: string;
  playerId: string;
  playerName: string;
  currentStatus: PlayerAvailability;
  suggestedStatus: PlayerAvailability;
  message: string;
  createdAt: string;
}

/**
 * User können bei falschem System-Status einen Vorschlag senden –
 * aber den Status nicht selbst ändern.
 */
export function StatusSuggestionForm({ player }: { player: Player }) {
  const t = useTranslations("PlayerDetail");
  const locale = useLocale();
  const current = player.availability ?? "available";
  const meta = getAvailabilityMeta(current);
  const currentLabel = getAvailabilityLabel(current, locale);

  const [open, setOpen] = useState(false);
  const [suggested, setSuggested] = useState<PlayerAvailability>("available");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) {
      toast.error(t("reasonRequired"));
      return;
    }

    setSending(true);
    const payload: StatusSuggestion = {
      id: `sug-${Date.now()}`,
      playerId: player.id,
      playerName: player.name,
      currentStatus: current,
      suggestedStatus: suggested,
      message: message.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      const existing = safeJsonParse<StatusSuggestion[]>(
        typeof window !== "undefined"
          ? localStorage.getItem(STORAGE_KEYS.statusSuggestions)
          : null,
        []
      );
      existing.unshift(payload);
      localStorage.setItem(
        STORAGE_KEYS.statusSuggestions,
        JSON.stringify(existing.slice(0, 50))
      );

      try {
        await fetch("/api/status-suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {
        // offline ok
      }

      toast.success(t("thanks"));
      setMessage("");
      setOpen(false);
    } finally {
      setSending(false);
    }
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full sm:w-auto"
        onClick={() => setOpen(true)}
      >
        <MessageSquareWarning className="h-3.5 w-3.5" />
        {t("reportStatus")}
      </Button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-xl border border-border bg-secondary/30 p-4"
    >
      <div>
        <p className="text-sm font-semibold">{t("suggestStatus")}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("currentStatus")}{" "}
          <span
            className={cn(
              "font-semibold",
              meta.badgeClass,
              "rounded px-1.5 py-0.5 border"
            )}
          >
            {meta.emoji} {currentLabel}
          </span>
          . {t("cannotChange")}
        </p>
      </div>

      <div>
        <label htmlFor="sug-status" className="mb-1 block text-xs font-medium">
          {t("suggestedStatus")}
        </label>
        <select
          id="sug-status"
          value={suggested}
          onChange={(e) => setSuggested(e.target.value as PlayerAvailability)}
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
        >
          {AVAILABILITY_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.emoji} {getAvailabilityLabel(o.id, locale)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="sug-msg" className="mb-1 block text-xs font-medium">
          {t("reason")}
        </label>
        <Input
          id="sug-msg"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t("reasonPlaceholder")}
          required
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={sending}>
          <Send className="h-3.5 w-3.5" />
          {sending ? "…" : t("send")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setOpen(false)}
        >
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
