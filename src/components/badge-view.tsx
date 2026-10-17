import type { CSSProperties } from "react";
import type { BadgeSpec } from "@/lib/club-badge";

/**
 * Vereinsfarben-Kreis (rein darstellend, auch in Client-Komponenten nutzbar).
 * Steht der Name daneben, ist der Kreis dekorativ (aria-hidden);
 * ohne sichtbaren Namen `label` setzen → role="img" + aria-label.
 */
export function BadgeView({ b, size = 20, label }: { b: BadgeSpec; size?: number; label?: string }) {
  const ringW = Math.max(1.5, Math.round(size * 0.09 * 2) / 2);
  const style: CSSProperties = {
    width: size,
    height: size,
    fontSize: Math.max(6.5, size * (b.abbr.length >= 4 ? 0.29 : 0.36)),
    color: b.fg,
    textShadow: b.split ? (b.fg === "#FFFFFF" ? "0 0 2px #000, 0 0 1px #000" : "0 0 2px #fff, 0 0 1px #fff, 0 0 1px #fff") : undefined,
    background: b.split ? `linear-gradient(90deg, ${b.bg} 50%, ${b.ring} 50%)` : b.bg,
    boxShadow: b.split
      ? "0 0 0 1px rgba(15, 23, 42, 0.18)"
      : `inset 0 0 0 ${ringW}px ${b.ring}, 0 0 0 1px rgba(15, 23, 42, 0.14)`,
  };
  return (
    <span
      className={b.known ? "cb" : "cb cb-unknown"}
      style={style}
      {...(label ? { role: "img", "aria-label": label, title: label } : { "aria-hidden": true })}
    >
      {b.abbr}
    </span>
  );
}
