import type { ReactNode } from "react";
import { badgeFor } from "@/lib/club-badge";
import { BadgeView } from "./badge-view";

/** Vereinsfarben-Kreis zum Vereins-/Ländernamen (Server-Komponente). */
export function ClubBadge({ name, size, label }: { name: string | null | undefined; size?: number; label?: string }) {
  if (!name) return null;
  return <BadgeView b={badgeFor(name)} size={size} label={label} />;
}

/**
 * Kreis + Name. `name` ist der Datenname (für die Farbsuche),
 * `children` die angezeigte (ggf. übersetzte) Bezeichnung.
 * `after` = Kreis rechts vom Namen (z. B. Heimteam vor dem Ergebnis).
 */
export function Club({
  name,
  children,
  size,
  after = false,
  className,
}: {
  name: string;
  children?: ReactNode;
  size?: number;
  after?: boolean;
  className?: string;
}) {
  const badge = <ClubBadge name={name} size={size} />;
  return (
    <span className={className ? `club ${className}` : "club"}>
      {after ? null : badge}
      <span className="club-n">{children ?? name}</span>
      {after ? badge : null}
    </span>
  );
}
