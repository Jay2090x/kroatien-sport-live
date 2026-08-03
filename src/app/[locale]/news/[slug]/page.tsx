import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import {
  getNewsBySlug,
  getAllNewsSlugs,
  tNews,
  NEWS_CATEGORY_LABEL,
  type NewsArticle,
} from "@/lib/data/news";
import { cleanNewsText } from "@/lib/data/news-images";
import { getDashboardData } from "@/lib/data/service";
import { SITE } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { ShareButton } from "@/components/share/share-button";
import { ArrowLeft, ExternalLink, Shield } from "lucide-react";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";
export const revalidate = 300;

function asLocale(locale: string): Locale {
  return locale === "en" || locale === "hr" ? locale : "de";
}

function formatDate(iso: string, locale: string): string {
  try {
    return new Date(iso + (iso.length === 10 ? "T12:00:00" : "")).toLocaleDateString(
      locale === "hr" ? "hr-HR" : locale === "en" ? "en-GB" : "de-DE",
      { day: "numeric", month: "long", year: "numeric" }
    );
  } catch {
    return iso;
  }
}

function safeText(raw: string): string {
  return cleanNewsText(raw, 2000) || "";
}

function bodyParagraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((p) => safeText(p).replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 2 && !/^https?:\/\//i.test(p));
}

export async function generateStaticParams() {
  try {
    const slugs = await getAllNewsSlugs();
    const locales = ["de", "en", "hr"] as const;
    return locales.flatMap((locale) =>
      slugs.slice(0, 40).map((slug) => ({ locale, slug }))
    );
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const loc = asLocale(locale);
  let matches: Awaited<ReturnType<typeof getDashboardData>>["matches"] = [];
  let players: Awaited<ReturnType<typeof getDashboardData>>["players"] = [];
  try {
    const data = await getDashboardData();
    matches = data.matches;
    players = data.players;
  } catch {
    /* ok */
  }
  const article = await getNewsBySlug(slug, { matches, players }, loc);
  if (!article) return { title: "News" };

  const title = safeText(tNews(article.title, locale)) || "News";
  const description =
    safeText(tNews(article.summary, locale)).slice(0, 160) || title;
  const path =
    locale === "de" ? `/news/${slug}` : `/${locale}/news/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE.url}${path}`,
      languages: {
        de: `${SITE.url}/news/${slug}`,
        en: `${SITE.url}/en/news/${slug}`,
        hr: `${SITE.url}/hr/news/${slug}`,
      },
    },
    openGraph: {
      type: "article",
      title,
      description,
      url: `${SITE.url}${path}`,
      publishedTime: article.date,
      images: article.image?.url ? [{ url: article.image.url }] : undefined,
    },
    robots: article.isExternal
      ? { index: true, follow: true }
      : undefined,
  };
}

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const loc = asLocale(locale);
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "News" });

  let matches: Awaited<ReturnType<typeof getDashboardData>>["matches"] = [];
  let players: Awaited<ReturnType<typeof getDashboardData>>["players"] = [];
  try {
    const data = await getDashboardData();
    matches = data.matches;
    players = data.players;
  } catch {
    /* ok */
  }

  const article = await getNewsBySlug(slug, { matches, players }, loc);
  if (!article) notFound();

  const title = safeText(tNews(article.title, locale));
  const summary = safeText(tNews(article.summary, locale));
  const paras = bodyParagraphs(tNews(article.body, locale));
  const cat = tNews(NEWS_CATEGORY_LABEL[article.category], locale);
  const tag = safeText(tNews(article.tag, locale));
  // Doppel-Badge vermeiden: Tag enthält oft schon Kategorie/Quelle
  const showCat =
    !tag.toLowerCase().includes(cat.toLowerCase()) &&
    !article.isExternal;
  const img = article.image;
  const isCutout = img ? /cutout/i.test(img.url) : false;
  const isLogo = img
    ? /badge|logo|thumb|teamlogos|leaguelogos|countries/i.test(img.url)
    : false;
  const path =
    locale === "de" ? `/news/${slug}` : `/${locale}/news/${slug}`;
  const external = Boolean(
    article.isExternal || article.id.startsWith("auto-")
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": external ? "WebPage" : "NewsArticle",
    name: title,
    headline: title,
    description: summary,
    datePublished: article.date,
    inLanguage: article.sourceLang || locale,
    mainEntityOfPage: `${SITE.url}${path}`,
    image: img?.url ? [img.url] : undefined,
    author: { "@type": "Organization", name: SITE.name, url: SITE.url },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
    },
    ...(article.sourceUrl
      ? { significantLink: article.sourceUrl }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="mx-auto max-w-2xl px-3 py-6 sm:px-6 sm:py-8">
        <nav className="mb-5 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("backHome")}
            </Link>
            <Link
              href="/news"
              className="text-muted-foreground hover:text-foreground"
            >
              {t("allNews")}
            </Link>
          </div>
          <ShareButton title={title} text={summary} url={path} />
        </nav>

        <article>
          <div className="flex gap-3 border-b border-border pb-4">
            {img && (
              <div
                className={
                  isCutout
                    ? "relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-gradient-to-b from-[#0b1f4a] to-[#1a3a6b] sm:h-24 sm:w-24"
                    : "relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary sm:h-24 sm:w-24"
                }
              >
                <Image
                  src={img.url}
                  alt={tNews(img.alt, locale)}
                  width={96}
                  height={96}
                  className={
                    isCutout
                      ? "h-full w-full object-contain object-bottom p-0.5"
                      : isLogo
                        ? "h-full w-full object-contain p-2"
                        : "h-full w-full object-cover"
                  }
                  unoptimized
                  priority
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {tag && <Badge variant="outline">{tag}</Badge>}
                {showCat && <Badge variant="secondary">{cat}</Badge>}
                {external && (
                  <Badge variant="secondary">{t("externalBadge")}</Badge>
                )}
                <time dateTime={article.date} className="text-muted-foreground">
                  {formatDate(article.date, locale)}
                </time>
              </div>
              <h1 className="mt-1.5 text-xl font-bold leading-snug tracking-tight sm:text-2xl">
                {title}
              </h1>
              {article.sourceLang && article.sourceLang !== loc && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {t("originalLang", {
                    lang: article.sourceLang.toUpperCase(),
                  })}
                </p>
              )}
            </div>
          </div>

          {external ? (
            <ExternalArticleBody
              article={article}
              summary={summary}
              paras={paras}
              t={t}
            />
          ) : (
            <>
              {summary && (
                <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                  {summary}
                </p>
              )}
              <div className="mt-5 space-y-3 border-t border-border pt-5">
                {paras.map((p, i) => (
                  <p
                    key={i}
                    className="text-[15px] leading-7 text-foreground/90 break-words"
                  >
                    {p}
                  </p>
                ))}
              </div>
            </>
          )}

          {article.sourceUrl?.startsWith("http") && (
            <p className="mt-6">
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                <span className="truncate">{t("originalSource")}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>
            </p>
          )}

          <p className="mt-4 flex items-start gap-1.5 text-[11px] leading-snug text-muted-foreground">
            <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            {t("legalNote")}
          </p>
        </article>
      </main>
      <Footer />
    </>
  );
}

function ExternalArticleBody({
  article,
  summary,
  paras,
  t,
}: {
  article: NewsArticle;
  summary: string;
  paras: string[];
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  // Nur saubere, kurze Hinweise – nie RSS-HTML
  const cleanParas = paras.filter(
    (p) =>
      p.length > 20 &&
      !/<\/?[a-z]|href\s*=|_blank/i.test(p) &&
      !p.includes("<a ")
  );

  return (
    <div className="mt-4 space-y-4">
      {summary && (
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          {summary}
        </p>
      )}
      <div className="rounded-xl border border-border bg-secondary/30 px-3.5 py-3">
        <p className="text-sm font-semibold">{t("externalLead")}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {t("externalHint", {
            source: article.sourceName || "—",
          })}
        </p>
      </div>
      {cleanParas.slice(0, 3).map((p, i) => (
        <p
          key={i}
          className="text-[15px] leading-7 text-foreground/90 break-words"
        >
          {p}
        </p>
      ))}
    </div>
  );
}
