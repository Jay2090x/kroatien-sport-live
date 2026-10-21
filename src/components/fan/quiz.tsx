"use client";

import { useState } from "react";
import type { QuizQ } from "@/data/quiz";
import type { X2 } from "@/lib/fan/i18n2";

/** Rein clientseitig: kein Speichern, keine Cookies, keine Netzwerkanfragen. */
export function Quiz({ qs, lang, L }: { qs: QuizQ[]; lang: "de" | "hr"; L: Omit<X2["quiz"], "question" | "result" | "verdict"> & { n: number } }) {
  const [i, setI] = useState(-1);
  const [pick, setPick] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const n = qs.length;
  const qLabel = lang === "hr" ? `Pitanje ${i + 1} od ${n}` : `Frage ${i + 1} von ${n}`;

  if (i < 0)
    return (
      <button type="button" className="btn quiz-start" onClick={() => setI(0)}>
        {L.start} ▶
      </button>
    );

  if (i >= n) {
    const r = score / n;
    const verdict =
      lang === "hr"
        ? r >= 0.9 ? "Legenda Vatrenih! 🔥" : r >= 0.7 ? "Pravi navijač! 🇭🇷" : r >= 0.4 ? "Solidno – može i bolje." : "Vrijeme za sat povijesti 😉"
        : r >= 0.9 ? "Vatreni-Legende! 🔥" : r >= 0.7 ? "Echter Fan! 🇭🇷" : r >= 0.4 ? "Solide – da geht noch was." : "Zeit für die Geschichtsstunde 😉";
    return (
      <div className="quiz-end" role="status">
        <p className="quiz-score">{score} / {n}</p>
        <p>{lang === "hr" ? `Točno si odgovorio/la na ${score} od ${n} pitanja.` : `Du hast ${score} von ${n} Fragen richtig beantwortet.`}</p>
        <p className="strong">{verdict}</p>
        <button type="button" className="btn" onClick={() => { setI(0); setPick(null); setScore(0); }}>
          {L.again}
        </button>
      </div>
    );
  }

  const q = qs[i];
  const opts = q.options[lang];
  const answered = pick != null;
  return (
    <div className="quiz-q">
      <p className="label">{qLabel} · {L.score}: {score}</p>
      <h2 className="quiz-h">{q.q[lang]}</h2>
      <ul className="quiz-opts">
        {opts.map((o, k) => {
          const cls = !answered ? "" : k === q.a ? " ok" : k === pick ? " no" : "";
          return (
            <li key={k}>
              <button
                type="button"
                className={`quiz-opt${cls}`}
                disabled={answered}
                aria-pressed={pick === k}
                onClick={() => {
                  setPick(k);
                  if (k === q.a) setScore((s) => s + 1);
                }}
              >
                {o}
              </button>
            </li>
          );
        })}
      </ul>
      {answered && (
        <div className="quiz-fb" role="status">
          <p className={pick === q.a ? "ok strong" : "no strong"}>{pick === q.a ? L.right : `${L.wrong} ${L.answer}: ${opts[q.a]}`}</p>
          <p>{q.fact[lang]}</p>
          <p className="small muted">
            {L.source}: <a href={q.source.url} target="_blank" rel="noopener">{q.source.title}</a>
          </p>
          <button type="button" className="btn" onClick={() => { setI(i + 1); setPick(null); }}>
            {L.next} →
          </button>
        </div>
      )}
    </div>
  );
}
