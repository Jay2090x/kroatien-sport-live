import { ImageResponse } from "next/og";

export const runtime = "edge";

/**
 * Dynamisches Vorschaubild (1200×630) für WhatsApp, X, Facebook & Co.
 * Reines Text-/Farbbild – keine Logos, Wappen oder Fotos.
 * /og?t=Titel&s=Untertitel&l=hr
 */
export function GET(req: Request) {
  const u = new URL(req.url);
  const t = (u.searchParams.get("t") || "Kroatien Sport Live").slice(0, 90);
  const s = (u.searchParams.get("s") || "").slice(0, 120);
  const hr = u.searchParams.get("l") === "hr";
  const squares = Array.from({ length: 10 });
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#ffffff",
          color: "#0f172a",
          fontFamily: "sans-serif",
          borderTop: "24px solid #d7141a",
          borderBottom: "24px solid #171796",
          padding: "56px 72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ display: "flex", flexWrap: "wrap", width: 60, height: 60 }}>
            {squares.slice(0, 9).map((_, i) => (
              <div key={i} style={{ width: 20, height: 20, background: i % 2 === 0 ? "#d7141a" : "#ffffff" }} />
            ))}
          </div>
          <div style={{ fontSize: 34, fontWeight: 700, color: "#475569" }}>Kroatien Sport Live</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: t.length > 40 ? 64 : 80, fontWeight: 800, letterSpacing: -2, lineHeight: 1.05 }}>{t}</div>
          {s ? <div style={{ fontSize: 34, marginTop: 22, color: "#475569", lineHeight: 1.25 }}>{s}</div> : null}
        </div>
        <div style={{ fontSize: 26, color: "#64748b" }}>
          {hr ? "kroatien-sport-live.vercel.app/hr" : "kroatien-sport-live.vercel.app"}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable" },
    }
  );
}
