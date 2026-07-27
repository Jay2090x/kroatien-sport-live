import { cn } from "@/lib/utils";

/**
 * Einheitliche Sektions-Köpfe – roter Faden über die ganze Seite
 */
export function SectionHeader({
  id,
  title,
  subtitle,
  icon,
  className,
  action,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "mb-3 flex flex-wrap items-end justify-between gap-2",
        className
      )}
    >
      <div className="min-w-0">
        <h2
          id={id}
          className="flex items-center gap-2 text-lg font-bold tracking-tight sm:text-xl"
        >
          {icon}
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
