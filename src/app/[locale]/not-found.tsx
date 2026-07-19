import { Link } from "@/i18n/navigation";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-6xl font-black text-primary">404</p>
      <h1 className="text-xl font-bold">Seite nicht gefunden</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Die angeforderte Seite existiert nicht oder wurde verschoben.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        Zur Startseite
      </Link>
    </div>
  );
}
