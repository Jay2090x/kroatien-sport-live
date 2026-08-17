import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";
import { getAllNewsSlugs } from "@/lib/data/news";
import { FALLBACK_PLAYERS } from "@/lib/data/fallback-players";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url;
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: `${base}/en`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${base}/hr`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${base}/news`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.95,
    },
    {
      url: `${base}/en/news`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${base}/hr/news`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    ...(["", "/en", "/hr"] as const).flatMap((prefix) =>
      ["/impressum", "/datenschutz", "/nutzung"].map((path) => ({
        url: `${base}${prefix}${path}`,
        lastModified: now,
        changeFrequency: "monthly" as const,
        priority: 0.3,
      }))
    ),
    ...FALLBACK_PLAYERS.filter((p) => p.isActive !== false).flatMap((p) =>
      (["", "/en", "/hr"] as const).map((prefix) => ({
        url: `${base}${prefix}/player/${p.id}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.7,
      }))
    ),
  ];

  let newsEntries: MetadataRoute.Sitemap = [];
  try {
    const slugs = await getAllNewsSlugs();
    newsEntries = slugs.flatMap((slug) => [
      {
        url: `${base}/news/${slug}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.8,
      },
      {
        url: `${base}/en/news/${slug}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.75,
      },
      {
        url: `${base}/hr/news/${slug}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.75,
      },
    ]);
  } catch {
    newsEntries = [];
  }

  return [...staticEntries, ...newsEntries];
}
