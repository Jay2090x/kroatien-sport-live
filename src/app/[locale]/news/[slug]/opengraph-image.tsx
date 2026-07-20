import { ImageResponse } from "next/og";
import { EDITORIAL_NEWS, tNews } from "@/lib/data/news";

export const alt = "Kroatien Sport Live News";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function NewsOgImage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const article = EDITORIAL_NEWS.find((a) => a.id === slug);
  const title = article
    ? tNews(article.title, locale)
    : slug
        .replace(/^auto-/, "")
        .replace(/^live-/, "")
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .slice(0, 100);
  const tag = article ? tNews(article.tag, locale) : "News";
  const date = article?.date ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background:
            "linear-gradient(145deg, #070b12 0%, #121c30 55%, #2a0c14 100%)",
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              background: "#c8102e",
              color: "white",
              fontSize: 22,
              fontWeight: 700,
              padding: "8px 16px",
              borderRadius: 999,
            }}
          >
            {tag}
          </div>
          {date ? (
            <span style={{ fontSize: 22, opacity: 0.7 }}>{date}</span>
          ) : null}
        </div>
        <div
          style={{
            fontSize: title.length > 70 ? 44 : 54,
            fontWeight: 800,
            lineHeight: 1.15,
            maxWidth: 1000,
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 24, fontWeight: 700, opacity: 0.9 }}>
            Kroatien Sport Live
          </span>
          <span style={{ fontSize: 22, opacity: 0.55 }}>
            kroatien-sport-live.vercel.app
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
