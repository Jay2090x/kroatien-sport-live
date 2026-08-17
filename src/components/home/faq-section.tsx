"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { isNationalTeamMatch } from "@/lib/data/national-team";
import { formatKickoff } from "@/lib/utils";
import { localizeTeamName } from "@/lib/team-names";

export function FaqSection() {
  const t = useTranslations("Faq");
  const locale = useLocale();
  const { matches } = useDashboard();

  const nextNtLine = useMemo(() => {
    const nt = matches
      .filter(
        (m) =>
          isNationalTeamMatch(m) &&
          (m.status === "scheduled" ||
            m.status === "live" ||
            m.status === "halftime")
      )
      .sort(
        (a, b) =>
          new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
      )[0];
    if (!nt) return t("a1Fallback");
    return t("a1Live", {
      fixture: `${localizeTeamName(nt.homeTeam, locale)} – ${localizeTeamName(nt.awayTeam, locale)}`,
      when: formatKickoff(nt.kickoff, "EEEE d. MMMM yyyy, HH:mm", locale),
    });
  }, [matches, locale, t]);

  const items = [
    { q: t("q1"), a: nextNtLine },
    { q: t("q2"), a: t("a2") },
    { q: t("q3"), a: t("a3") },
    { q: t("q4"), a: t("a4") },
    { q: t("q5"), a: t("a5") },
  ];

  return (
    <section id="faq" className="scroll-mt-14" aria-labelledby="faq-title">
      <h2
        id="faq-title"
        className="text-lg font-bold tracking-tight sm:text-xl"
      >
        {t("title")}
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">{t("subtitle")}</p>
      <dl className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {items.map((item) => (
          <div key={item.q} className="px-4 py-3">
            <dt className="text-sm font-semibold">{item.q}</dt>
            <dd className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
              {item.a}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function faqItemsForLd(
  t: (key: string, values?: Record<string, string>) => string
): { q: string; a: string }[] {
  return [
    { q: t("q1"), a: t("a1Fallback") },
    { q: t("q2"), a: t("a2") },
    { q: t("q3"), a: t("a3") },
    { q: t("q4"), a: t("a4") },
    { q: t("q5"), a: t("a5") },
  ];
}
