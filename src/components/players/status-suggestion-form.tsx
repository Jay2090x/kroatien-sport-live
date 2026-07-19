"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { MessageSquareWarning, Send } from "lucide-react";
import type { Player, PlayerAvailability } from "@/types";
import { AVAILABILITY_OPTIONS, getAvailabilityMeta } from "@/lib/player-availability";
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
  const isDe = useLocale() !== "en";
  const current = player.availability ?? "available";
  const meta = getAvailabilityMeta(current);

  const [open, setOpen] = useState(false);
  const [suggested, setSuggested] = useState<PlayerAvailability>("available");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) {
      toast.error(isDe ? "Bitte kurz beschreiben, was falsch ist." : "Please describe the issue.");
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
      // Lokal speichern (Queue)
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

      // Optional Server
      try {
        await fetch("/api/status-suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {
        // offline ok
      }

      toast.success(
        isDe
          ? "Danke! Dein Vorschlag wurde gespeichert. Wir prüfen ihn."
          : "Thanks! Your suggestion was saved. We'll review it."
      );
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
        {isDe ? "Status-Fehler melden" : "Report status error"}
      </Button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-xl border border-border bg-secondary/30 p-4"
    >
      <div>
        <p className="text-sm font-semibold">
          {isDe ? "Status-Korrektur vorschlagen" : "Suggest status correction"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {isDe
            ? "Aktueller System-Status: "
            : "Current system status: "}
          <span className={cn("font-semibold", meta.badgeClass, "rounded px-1.5 py-0.5 border")}>
            {meta.emoji} {isDe ? meta.labelDe : meta.labelEn}
          </span>
          .{" "}
          {isDe
            ? "Du kannst den Status nicht selbst ändern – nur einen Vorschlag senden."
            : "You cannot change status yourself – only send a suggestion."}
        </p>
      </div>

      <div>
        <label htmlFor="sug-status" className="mb-1 block text-xs font-medium">
          {isDe ? "Vorgeschlagener Status" : "Suggested status"}
        </label>
        <select
          id="sug-status"
          value={suggested}
          onChange={(e) => setSuggested(e.target.value as PlayerAvailability)}
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
        >
          {AVAILABILITY_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.emoji} {isDe ? o.labelDe : o.labelEn}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="sug-msg" className="mb-1 block text-xs font-medium">
          {isDe ? "Begründung / Quelle" : "Reason / source"}
        </label>
        <Input
          id="sug-msg"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            isDe
              ? "z.B. Spielt seit gestern wieder, siehe Club-Pressemitteilung…"
              : "e.g. back in training, see club press release…"
          }
          required
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={sending}>
          <Send className="h-3.5 w-3.5" />
          {sending ? "…" : isDe ? "Vorschlag senden" : "Send suggestion"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setOpen(false)}
        >
          {isDe ? "Abbrechen" : "Cancel"}
        </Button>
      </div>
    </form>
  );
}
