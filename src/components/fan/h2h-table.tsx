"use client";

import { useMemo, useState } from "react";
import type { H2H } from "@/data/h2h";

type SortKey = "p" | "pct" | "name" | "gd";
interface L {
  filter: string; sort: string; none: string;
  sorts: Record<SortKey, string>;
  cols: { team: string; p: string; w: string; d: string; l: string; goals: string; pct: string };
}

const pct = (r: H2H) => (r.p ? Math.round((r.w / r.p) * 100) : 0);

/** Filter- und sortierbare Bilanztabelle – rein clientseitig, ohne Netzwerkanfragen. */
export function H2HTable({ rows, lang, L }: { rows: H2H[]; lang: "de" | "hr"; L: L }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("p");
  const coll = useMemo(() => new Intl.Collator(lang === "hr" ? "hr" : "de"), [lang]);
  const list = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase(lang);
    const xs = rows.filter((r) => !needle || r[lang].toLocaleLowerCase(lang).includes(needle));
    const by: Record<SortKey, (a: H2H, b: H2H) => number> = {
      p: (a, b) => b.p - a.p || coll.compare(a[lang], b[lang]),
      pct: (a, b) => pct(b) - pct(a) || b.p - a.p,
      name: (a, b) => coll.compare(a[lang], b[lang]),
      gd: (a, b) => b.gf - b.ga - (a.gf - a.ga) || b.p - a.p,
    };
    return [...xs].sort(by[sort]);
  }, [rows, q, sort, lang, coll]);
  return (
    <div>
      <div className="h2h-controls">
        <label className="h2h-label">
          <span className="sr-only">{L.filter}</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`🔎 ${L.filter}`} className="h2h-input" />
        </label>
        <label className="h2h-label">
          <span className="small muted">{L.sort}: </span>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="h2h-select">
            {(Object.keys(L.sorts) as SortKey[]).map((k) => (
              <option key={k} value={k}>{L.sorts[k]}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="table-wrap">
        <table className="table h2h-table">
          <thead>
            <tr>
              <th className="left">{L.cols.team}</th>
              <th className="num">{L.cols.p}</th>
              <th className="num">{L.cols.w}</th>
              <th className="num">{L.cols.d}</th>
              <th className="num">{L.cols.l}</th>
              <th className="num">{L.cols.goals}</th>
              <th className="num">{L.cols.pct}</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.en} className={r.w > r.l ? "h2h-plus" : r.w < r.l ? "h2h-minus" : "h2h-even"}>
                <td className="left"><span aria-hidden="true">{r.flag} </span>{r[lang]}</td>
                <td className="num">{r.p}</td>
                <td className="num">{r.w}</td>
                <td className="num">{r.d}</td>
                <td className="num">{r.l}</td>
                <td className="num">{r.gf}:{r.ga}</td>
                <td className="num strong">{pct(r)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {list.length === 0 && <p className="muted">{L.none}</p>}
    </div>
  );
}
