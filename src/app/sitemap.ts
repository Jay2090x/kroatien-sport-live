import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";
import { getAllNewsSlugs } from "@/lib/data/news";

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
