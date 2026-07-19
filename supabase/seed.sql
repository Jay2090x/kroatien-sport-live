-- Optional Seed – Beispiel-Spieler (Juli 2026)
-- Vollständige Demo-Daten liegen im Code unter src/lib/data/fallback-*.ts
-- Nach Schema-Migration kannst du via /api/refresh oder manuell upserten.

insert into public.players (
  id, name, short_name, club, league, league_name, position, position_label, shirt_number, is_active
) values
  ('modric', 'Luka Modrić', 'Modrić', 'AC Milan', 'serie-a', 'Serie A', 'CM', 'Zentrales Mittelfeld', 10, true),
  ('gvardiol', 'Joško Gvardiol', 'Gvardiol', 'Manchester City', 'premier-league', 'Premier League', 'CB', 'Innenverteidiger', 24, true),
  ('kovacic', 'Mateo Kovačić', 'Kovačić', 'Manchester City', 'premier-league', 'Premier League', 'CM', 'Zentrales Mittelfeld', 8, true),
  ('perisic', 'Ivan Perišić', 'Perišić', 'Hajduk Split', 'hnl', 'HNL', 'LW', 'Linksaußen', 4, true),
  ('stanisic', 'Josip Stanišić', 'Stanišić', 'Bayer Leverkusen', 'bundesliga', 'Bundesliga', 'RB', 'Rechter Verteidiger', 2, true)
on conflict (id) do update set
  club = excluded.club,
  league = excluded.league,
  league_name = excluded.league_name,
  updated_at = now();
