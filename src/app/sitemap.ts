import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE.url}/`, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE.url}/impressum`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE.url}/datenschutz`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE.url}/nutzung`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
