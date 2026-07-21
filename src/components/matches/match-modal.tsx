"use client";

import { useLocale, useTranslations } from "next-intl";
import type { Match } from "@/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { MatchDetailBody } from "@/components/matches/match-detail-body";
import {
  localizeCompetitionLabel,
  localizeTeamName,
} from "@/lib/team-names";
import { Link } from "@/i18n/navigation";

interface MatchModalProps {
  match: Match | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MatchModal({ match, open, onOpenChange }: MatchModalProps) {
  const t = useTranslations("Match");
  const locale = useLocale();
  const { players, setPlayerId } = useDashboard();

  if (!match) return null;

  const homeName = localizeTeamName(match.homeTeam, locale);
  const awayName = localizeTeamName(match.awayTeam, locale);
  const leagueLabel = localizeCompetitionLabel(match.leagueName, locale);
  const sharePath =
    locale === "de" ? `/match/${match.id}` : `/${locale}/match/${match.id}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={`${homeName} – ${awayName}`}
        description={leagueLabel}
        onClose={() => onOpenChange(false)}
        className="sm:max-w-xl"
      >
        <MatchDetailBody
          match={match}
          players={players}
          sharePath={sharePath}
          onPlayerClick={(id) => {
            onOpenChange(false);
            setPlayerId(id);
          }}
        />

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
          <Link
            href={`/match/${match.id}`}
            className="text-xs font-semibold text-primary hover:underline"
            onClick={() => onOpenChange(false)}
          >
            {t("openPage")}
          </Link>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
