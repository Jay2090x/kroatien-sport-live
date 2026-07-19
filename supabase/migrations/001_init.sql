-- Kroatien Sport Live – Initial Schema
-- In Supabase SQL Editor ausführen oder via CLI: supabase db push

-- Extensions
create extension if not exists "pgcrypto";

-- ─── Players ───
create table if not exists public.players (
  id text primary key,
  name text not null,
  short_name text,
  club text not null,
  club_id text,
  league text not null,
  league_name text not null,
  position text not null,
  position_label text,
  nationality text not null default 'HR',
  shirt_number int,
  image_url text,
  date_of_birth date,
  external_ids jsonb default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists players_league_idx on public.players (league);
create index if not exists players_active_idx on public.players (is_active);

-- ─── Matches ───
create table if not exists public.matches (
  id text primary key,
  home_team text not null,
  away_team text not null,
  home_team_logo text,
  away_team_logo text,
  home_score int,
  away_score int,
  status text not null default 'scheduled',
  minute int,
  kickoff timestamptz not null,
  league text not null,
  league_name text not null,
  venue text,
  croatian_players jsonb not null default '[]'::jsonb,
  tv_channels jsonb default '[]'::jsonb,
  stream_hints text[],
  external_ids jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists matches_kickoff_idx on public.matches (kickoff);
create index if not exists matches_status_idx on public.matches (status);
create index if not exists matches_league_idx on public.matches (league);

-- ─── User settings (optional, mit Supabase Auth) ───
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  notifications jsonb not null default '{}'::jsonb,
  favorite_player_ids text[] default '{}',
  locale text default 'de',
  updated_at timestamptz not null default now()
);

-- ─── RLS ───
alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.user_settings enable row level security;

-- Public read for players & matches
create policy "Public read players"
  on public.players for select
  using (true);

create policy "Public read matches"
  on public.matches for select
  using (true);

-- Service role schreibt via service key (bypasses RLS)
-- Optional: authenticated insert/update for admins
create policy "Service upsert players"
  on public.players for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Service upsert matches"
  on public.matches for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Users manage own settings"
  on public.user_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Realtime (optional) ───
-- In Supabase Dashboard: Database → Replication → matches
-- alter publication supabase_realtime add table public.matches;

-- ─── Status suggestions (User meldet Fehler, kein Self-Edit) ───
create table if not exists public.status_suggestions (
  id text primary key,
  player_id text not null,
  player_name text not null,
  current_status text not null,
  suggested_status text not null,
  message text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.status_suggestions enable row level security;

create policy "Anyone can insert status suggestions"
  on public.status_suggestions for insert
  with check (true);

create policy "Service read suggestions"
  on public.status_suggestions for select
  using (auth.role() = 'service_role');

-- ─── updated_at trigger ───
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists players_updated_at on public.players;
create trigger players_updated_at
  before update on public.players
  for each row execute function public.set_updated_at();

drop trigger if exists matches_updated_at on public.matches;
create trigger matches_updated_at
  before update on public.matches
  for each row execute function public.set_updated_at();
