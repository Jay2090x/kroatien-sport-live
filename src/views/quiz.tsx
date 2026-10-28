import Link from "next/link";
import { backLink } from "@/lib/nav";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Quiz } from "@/components/fan/quiz";
import { JsonLd, breadcrumbs } from "@/components/json-ld";
import { QUIZ } from "@/data/quiz";
import { QUIZ_MOMENTE } from "@/data/quiz-momente";
import { x2 } from "@/lib/fan/i18n2";
import { href, type Lang } from "@/lib/i18n";
import { SITE } from "@/lib/site";

export function QuizView({ lang }: { lang: Lang }) {
  const X = x2(lang).quiz;
  const { question: _q, result: _r, verdict: _v, ...labels } = X;
  void _q; void _r; void _v;
  return (
    <>
      <JsonLd
        data={breadcrumbs([
          { name: SITE.name, url: `${SITE.url}${href(lang, "/")}` },
          { name: X.h1, url: `${SITE.url}${href(lang, "/quiz")}` },
        ])}
      />
      <SiteHeader lang={lang} path="/quiz" />
      <main lang={lang} className="container page-fan">
        <section className="card" aria-labelledby="qz-h">
          <div className="card-head">
            <h1 id="qz-h" className="h1">🧠 {X.h1}</h1>
            <Link href={href(lang, backLink("/quiz", lang).path)} className="pill">{backLink("/quiz", lang).label}</Link>
          </div>
          <p className="intro">{X.intro}</p>
          <Quiz qs={QUIZ} lang={lang} L={{ ...labels, n: QUIZ.length }} />
        </section>
        <section className="card" id="momente-quiz" aria-labelledby="qz2-h">
          <h2 id="qz2-h">🔥 {lang === "hr" ? "Kviz: trenuci i rekordi" : "Quiz: Momente & Rekorde"}</h2>
          <p className="intro">
            {lang === "hr"
              ? "10 novih pitanja iz rubrika Trenuci Vatrenih, Hrvatska u brojkama i Bilanca – svi odgovori iz provjerenih podataka, uz izvor."
              : "10 neue Fragen aus Vatreni-Momente, Kroatien in Zahlen und der Bilanz – alle Antworten aus den geprüften Daten, jeweils mit Quelle."}
          </p>
          <Quiz qs={QUIZ_MOMENTE} lang={lang} L={{ ...labels, n: QUIZ_MOMENTE.length }} />
          <p className="more-link small">
            <Link href={href(lang, "/vatreni-momente")}>{lang === "hr" ? "🔥 Trenuci Vatrenih →" : "🔥 Vatreni-Momente →"}</Link>{" "}
            <Link href={href(lang, "/kroatien-in-zahlen")}>{lang === "hr" ? "📊 Hrvatska u brojkama →" : "📊 Kroatien in Zahlen →"}</Link>{" "}
            <Link href={href(lang, "/bilanz")}>{lang === "hr" ? "🆚 Bilanca →" : "🆚 Bilanz →"}</Link>
          </p>
        </section>
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
