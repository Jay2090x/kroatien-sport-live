export const dynamic = "force-dynamic";
const URL_ = "https://site.api.espn.com/apis/site/v2/sports/soccer/all/teams/477/schedule";
const UAS = [
  "KroatienSportLive/3.0 (kroatien-sport-live.vercel.app)",
  "KroatienSportLive/3.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
  "",
];
export async function GET() {
  const out: Record<string, number | string> = {};
  for (const ua of UAS) {
    try {
      const r = await fetch(URL_, { headers: ua ? { "User-Agent": ua } : {}, cache: "no-store" });
      out[ua || "(none)"] = r.status;
    } catch (e) {
      out[ua || "(none)"] = String(e);
    }
  }
  for (const host of ["site.web.api.espn.com", "site.api.espn.com"]) {
    try {
      const r = await fetch(`https://${host}/apis/site/v2/sports/basketball/nba/scoreboard`, { headers: { "User-Agent": UAS[0] }, cache: "no-store" });
      out[`nba@${host}`] = r.status;
    } catch (e) { out[`nba@${host}`] = String(e); }
  }
  return Response.json(out);
}
