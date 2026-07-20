import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Kroatien Sport Live";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 72,
          background: "linear-gradient(135deg, #070b12 0%, #0f1a2e 50%, #1a0a12 100%)",
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: "#c8102e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 800,
            }}
          >
            🇭🇷
          </div>
          <span style={{ fontSize: 28, fontWeight: 700, opacity: 0.9 }}>
            Kroatien Sport Live
          </span>
        </div>
        <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.1, maxWidth: 900 }}>
          Vatreni · Tracker · News
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 28,
            opacity: 0.75,
            maxWidth: 800,
          }}
        >
          Live-Ergebnisse und kroatische Stars in den Top-Ligen
        </div>
      </div>
    ),
    { ...size }
  );
}
