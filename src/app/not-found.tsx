"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Client-Komponente: Texte stehen nur im JS-Bundle, nicht im HTML jeder Seite
 * (sonst landet deutscher Text im RSC-Payload der HR-Seiten).
 */
export default function NotFound() {
  const hr = (usePathname() ?? "").startsWith("/hr");
  return (
    <main className="container legal-page">
      <div className="card">
        <h1>{hr ? "Stranica nije pronađena" : "Seite nicht gefunden"}</h1>
        <p>{hr ? "Ova stranica (više) ne postoji." : "Diese Seite gibt es (nicht mehr)."}</p>
        <p>
          <Link href={hr ? "/hr" : "/"}>{hr ? "← Na početnu" : "← Zur Startseite"}</Link>
        </p>
      </div>
    </main>
  );
}
