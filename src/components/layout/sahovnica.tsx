import { cn } from "@/lib/utils";

/** Kroatische Schachbrett-Flagge (Šahovnica) als Logo-Element */
export function Sahovnica({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim =
    size === "sm" ? "h-5 w-5" : size === "lg" ? "h-8 w-8" : "h-6 w-6";

  return (
    <span
      className={cn("sahovnica-badge", dim, className)}
      aria-hidden="true"
      title="Šahovnica"
    >
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}
