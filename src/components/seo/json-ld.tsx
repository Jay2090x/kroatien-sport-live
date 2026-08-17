import { SITE } from "@/lib/constants";
import { absoluteUrl } from "@/lib/seo";
import type { Match, Player } from "@/types";
import { isNationalTeamMatch } from "@/lib/data/national-team";

function JsonLdScript({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function SiteJsonLd({
  locale,
  matches,
  faq,
}: {
  locale: string;
  matches: Match[];
  faq: { q: string; a: string }[];
}) {
  const origin = SITE.url;
  const org = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: origin,
    logo: `${origin}/icon-192.png`,
    email: SITE.contactEmail,
    description: SITE.description,
    sameAs: [] as string[],
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: absoluteUrl(locale, "/"),
    inLanguage:
      locale === "hr" ? "hr-HR" : locale === "en" ? "en-GB" : "de-DE",
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl(locale, "/")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const nextNt = matches
    .filter(
      (m) =>
        isNationalTeamMatch(m) &&
        (m.status === "scheduled" ||
          m.status === "live" ||
          m.status === "halftime")
    )
    .sort(
      (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
    )[0];

  const event = nextNt
    ? {
        "@context": "https://schema.org",
        "@type": "SportsEvent",
        name: `${nextNt.homeTeam} vs ${nextNt.awayTeam}`,
        startDate: nextNt.kickoff,
        eventStatus:
          nextNt.status === "live" || nextNt.status === "halftime"
            ? "https://schema.org/EventScheduled"
            : "https://schema.org/EventScheduled",
        location: nextNt.venue
          ? { "@type": "Place", name: nextNt.venue }
          : undefined,
        homeTeam: { "@type": "SportsTeam", name: nextNt.homeTeam },
        awayTeam: { "@type": "SportsTeam", name: nextNt.awayTeam },
        sport: "Soccer",
        organizer: { "@type": "SportsOrganization", name: "HNS" },
        url: `${origin}${locale === "de" ? "" : `/${locale}`}/match/${nextNt.id}`,
      }
    : null;

  const faqLd =
    faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }
      : null;

  return (
    <>
      <JsonLdScript data={org} />
      <JsonLdScript data={website} />
      {event ? <JsonLdScript data={event} /> : null}
      {faqLd ? <JsonLdScript data={faqLd} /> : null}
    </>
  );
}

export function PlayerJsonLd({
  player,
  locale,
}: {
  player: Player;
  locale: string;
}) {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "Person",
        name: player.name,
        nationality: "HR",
        jobTitle: "Football player",
        affiliation: { "@type": "SportsTeam", name: player.club },
        image: player.imageUrl,
        url: `${SITE.url}${locale === "de" ? "" : `/${locale}`}/player/${player.id}`,
      }}
    />
  );
}
