import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Quiz } from "@/components/fan/quiz";
import { JsonLd, breadcrumbs } from "@/components/json-ld";
import { QUIZ } from "@/data/quiz";
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
      <main className="container page-fan">
        <section className="card" aria-labelledby="qz-h">
          <div className="card-head">
            <h1 id="qz-h" className="h1">🧠 {X.h1}</h1>
            <Link href={href(lang, "/#extras")} className="pill">← Vatreni</Link>
          </div>
          <p className="intro">{X.intro}</p>
          <Quiz qs={QUIZ} lang={lang} L={{ ...labels, n: QUIZ.length }} />
        </section>
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
