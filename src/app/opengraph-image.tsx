import { ImageResponse } from "next/og";

export const alt = "Kroatien Sport Live – Vatreni, SuperSport HNL & News";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Reines Text-/Farbbild, keine Logos oder Fotos. */
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
          padding: 80,
          background: "#ffffff",
          color: "#0f172a",
          fontFamily: "sans-serif",
          borderTop: "24px solid #d7141a",
          borderBottom: "24px solid #171796",
        }}
      >
        <div style={{ fontSize: 76, fontWeight: 800, letterSpacing: -2 }}>Kroatien Sport Live</div>
        <div style={{ fontSize: 40, marginTop: 20, color: "#475569" }}>Vatreni · SuperSport HNL · News</div>
      </div>
    ),
    size
  );
}
