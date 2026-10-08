"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="container legal-page">
      <div className="card">
        <h1>Da ist etwas schiefgelaufen</h1>
        <p>Die Seite konnte gerade nicht geladen werden.</p>
        <p>
          <button type="button" className="btn" onClick={() => reset()}>
            Erneut versuchen
          </button>
        </p>
      </div>
    </main>
  );
}
