import { initials, photoFor } from "@/lib/photos";
import type { Lang } from "@/lib/i18n";

/**
 * Kleines rundes Porträt. Mit Foto: Link zur Commons-Dateiseite, Bildnachweis
 * (Urheber, Lizenz, Ausschnitt) als Tooltip und für Screenreader.
 * Ohne freies Foto: neutraler Platzhalter mit Initialen (keine generierten Gesichter).
 * Funktioniert in Server- und Client-Komponenten (keine Hooks).
 */
export function Avatar({
  pkey,
  name,
  size = 40,
  lang = "de",
  placeholder = true,
}: {
  pkey: string | null | undefined;
  name: string;
  size?: number;
  lang?: Lang;
  /** false = ohne Foto gar nichts anzeigen */
  placeholder?: boolean;
}) {
  const p = photoFor(pkey);
  const box = { width: size, height: size } as const;
  if (!p) {
    if (!placeholder) return null;
    return (
      <span className="av av-ph" style={{ ...box, fontSize: Math.round(size * 0.36) }} aria-hidden="true">
        {initials(name)}
      </span>
    );
  }
  const de = lang === "de";
  const credit = `${de ? "Foto" : "Fotografija"}: ${p.author} · ${p.license}${de ? " · Wikimedia Commons · Bildausschnitt" : " · Wikimedia Commons · izrezano"}`;
  const { x, y, zoom } = p.focus;
  const w = size * zoom;
  const h = (w * p.h) / p.w;
  const left = Math.min(0, Math.max(size - w, size / 2 - x * w));
  const top = Math.min(0, Math.max(size - h, size / 2 - y * h));
  return (
    <a
      className="av"
      style={box}
      href={p.page}
      target="_blank"
      rel="noopener"
      title={credit}
      aria-label={`${name} – ${credit}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- lokale Commons-Vorschau, Ausschnitt per Position */}
      <img
        src={p.src}
        alt=""
        width={Math.round(w)}
        height={Math.round(h)}
        loading="lazy"
        decoding="async"
        style={{ width: w, height: h, left, top }}
      />
    </a>
  );
}
