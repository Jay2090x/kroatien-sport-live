import type { Metadata } from "next";
import { seo } from "@/lib/seo";
import { MatchView, loadMatch } from "@/views/match";
import { x2 } from "@/lib/fan/i18n2";
import { dataLabel } from "@/lib/i18n";
import { formatShortDate } from "@/lib/time";

export const revalidate = 300;
export const maxDuration = 30;
export const dynamicParams = true;

/** ISR: Spielseiten werden beim ersten Aufruf erzeugt und dann gecacht. */
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const tk = await loadMatch(id);
  const X = x2("hr").match;
  if (!tk) return { title: X.notFound, robots: { index: false } };
  const h = dataLabel(tk.home.name, "hr");
  const a = dataLabel(tk.away.name, "hr");
  const when = formatShortDate(tk.kickoff, "hr");
  const title = X.metaTitle(h, a);
  const desc = X.metaDesc(h, a, when);
  const score = tk.home.score != null && tk.away.score != null ? `${h} ${tk.home.score}:${tk.away.score} ${a}` : `${h} – ${a}`;
  return {
    title,
    description: desc,
    ...seo(`/vatreni/spiel/${tk.eventId}`, "hr", title, desc, { title: score, sub: `${dataLabel(tk.competition, "hr")} · ${when}` }),
  };
}

export default async function MatchPageHr({ params }: Props) {
  const { id } = await params;
  return <MatchView id={id} lang="hr" />;
}
