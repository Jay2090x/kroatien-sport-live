"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ExternalLink, Flag, ThumbsDown, ThumbsUp } from "lucide-react";
import type { StreamProvider } from "@/types/guide";
import { QualityBadge } from "@/components/guide/quality-badge";
import { VpnAffiliateBox } from "@/components/guide/vpn-affiliate-box";
import { Button } from "@/components/ui/button";
import { safeJsonParse, cn } from "@/lib/utils";
import { useGeoCountry } from "@/hooks/use-geo-country";
import { toast } from "sonner";

const VOTE_KEY = "ksl_stream_votes";

type VoteMap = Record<string, { up: number; down: number; my?: "up" | "down" }>;

function loadVotes(): VoteMap {
  if (typeof window === "undefined") return {};
  return safeJsonParse(localStorage.getItem(VOTE_KEY), {});
}

function saveVotes(v: VoteMap) {
  localStorage.setItem(VOTE_KEY, JSON.stringify(v));
}

export function StreamRow({ stream }: { stream: StreamProvider }) {
  const t = useTranslations("Guide");
  const { country, ready } = useGeoCountry();
  const [votes, setVotes] = useState({
    up: stream.upvotes,
    down: stream.downvotes,
    my: undefined as "up" | "down" | undefined,
  });

  useEffect(() => {
    const map = loadVotes();
    const v = map[stream.id];
    if (v) {
      setVotes({
        up: stream.upvotes + (v.up || 0),
        down: stream.downvotes + (v.down || 0),
        my: v.my,
      });
    }
  }, [stream.id, stream.upvotes, stream.downvotes]);

  const total = votes.up + votes.down;
  const pct = total > 0 ? Math.round((votes.up / total) * 100) : null;

  const geoBlocked =
    ready &&
    country &&
    stream.geoLockedOutside &&
    stream.availableIn.length > 0 &&
    !stream.availableIn.map((c) => c.toUpperCase()).includes(country);

  function vote(dir: "up" | "down") {
    const map = loadVotes();
    const prev = map[stream.id] || { up: 0, down: 0 };
    let up = prev.up;
    let down = prev.down;
    let my = prev.my;

    if (my === dir) {
      // toggle off
      if (dir === "up") up -= 1;
      else down -= 1;
      my = undefined;
    } else {
      if (my === "up") up -= 1;
      if (my === "down") down -= 1;
      if (dir === "up") up += 1;
      else down += 1;
      my = dir;
    }

    map[stream.id] = { up, down, my };
    saveVotes(map);
    setVotes({
      up: stream.upvotes + up,
      down: stream.downvotes + down,
      my,
    });
  }

  function reportBroken() {
    const key = "ksl_stream_reports";
    const list = safeJsonParse<{ id: string; at: string }[]>(
      localStorage.getItem(key),
      []
    );
    list.unshift({ id: stream.id, at: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(list.slice(0, 40)));
    toast.success(t("reportThanks"));
  }

  return (
    <div className="rounded-xl border border-border/80 bg-secondary/20 p-2.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-bold">{stream.name}</span>
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase",
                stream.type === "free"
                  ? "badge-croatia"
                  : "badge-croatia-blue"
              )}
            >
              {stream.type === "free" ? t("free") : t("paid")}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {stream.qualities.map((q) => (
              <QualityBadge key={q} q={q} />
            ))}
          </div>
        </div>
        <a
          href={stream.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-live px-2.5 text-xs font-bold text-[#04120a] shadow-[var(--glow-live)] hover:brightness-110"
        >
          {t("watch")}
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        {pct != null && (
          <span className="font-semibold text-emerald-300/90">
            {t("positive", { pct })}
          </span>
        )}
        <button
          type="button"
          onClick={() => vote("up")}
          className={cn(
            "inline-flex items-center gap-0.5 rounded-md border border-border px-1.5 py-0.5 hover:bg-secondary",
            votes.my === "up" && "border-emerald-500/50 text-emerald-300"
          )}
          aria-label={t("upvote")}
        >
          <ThumbsUp className="h-3 w-3" />
          {votes.up}
        </button>
        <button
          type="button"
          onClick={() => vote("down")}
          className={cn(
            "inline-flex items-center gap-0.5 rounded-md border border-border px-1.5 py-0.5 hover:bg-secondary",
            votes.my === "down" && "border-red-500/50 text-red-300"
          )}
          aria-label={t("downvote")}
        >
          <ThumbsDown className="h-3 w-3" />
          {votes.down}
        </button>
        <button
          type="button"
          onClick={reportBroken}
          className="inline-flex items-center gap-0.5 rounded-md border border-border px-1.5 py-0.5 hover:bg-secondary"
        >
          <Flag className="h-3 w-3" />
          {t("reportBroken")}
        </button>
      </div>

      {geoBlocked && <VpnAffiliateBox streamName={stream.name} />}
    </div>
  );
}
