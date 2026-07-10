-- FIFA Dynamics League — Supabase スキーマ
-- 要件定義書 §7.2 準拠。Supabase SQL Editor でそのまま実行できる。
-- RLS は有効化しない（Supabase へのアクセスはすべてサーバー側 service role キー経由のため）。

create extension if not exists pgcrypto;

-- ============================================================
-- teams
-- ============================================================
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  display_order integer not null default 0,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- matches
-- ============================================================
create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  stage text not null check (stage in ('group', 'semifinal', 'final', 'third_place', 'replay')),
  round_name text,
  match_datetime timestamptz,
  home_team_id uuid not null references teams (id) on delete restrict,
  away_team_id uuid not null references teams (id) on delete restrict,
  home_score integer,
  away_score integer,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'draw_replay_needed', 'postponed')),
  parent_match_id uuid references matches (id) on delete set null,
  replay_of_match_id uuid references matches (id) on delete set null,
  winner_team_id uuid references teams (id) on delete set null,
  loser_team_id uuid references teams (id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint matches_home_away_distinct check (home_team_id <> away_team_id),
  constraint matches_completed_requires_score check (
    status <> 'completed' or (home_score is not null and away_score is not null)
  ),
  constraint matches_score_non_negative check (
    (home_score is null or home_score >= 0) and (away_score is null or away_score >= 0)
  )
);

create index if not exists matches_stage_idx on matches (stage);
create index if not exists matches_status_idx on matches (status);
create index if not exists matches_home_team_idx on matches (home_team_id);
create index if not exists matches_away_team_idx on matches (away_team_id);

-- ============================================================
-- match_events
-- event_type は将来 'own_goal' 等を追加できるよう text + check 制約で管理する
-- ============================================================
create table if not exists match_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches (id) on delete cascade,
  team_id uuid not null references teams (id) on delete restrict,
  player_name text not null check (btrim(player_name) <> ''),
  event_type text not null check (event_type in ('goal', 'assist', 'yellow_card', 'red_card')),
  minute integer,
  related_goal_event_id uuid references match_events (id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists match_events_match_idx on match_events (match_id);
create index if not exists match_events_team_idx on match_events (team_id);
create index if not exists match_events_player_idx on match_events (player_name);
create index if not exists match_events_event_type_idx on match_events (event_type);

-- ============================================================
-- suspensions
-- ============================================================
create table if not exists suspensions (
  id uuid primary key default gen_random_uuid(),
  player_name text not null,
  team_id uuid not null references teams (id) on delete cascade,
  reason text not null check (reason in ('yellow_accumulation', 'red_card')),
  source_match_id uuid not null references matches (id) on delete cascade,
  suspension_match_id uuid references matches (id) on delete set null,
  is_served boolean not null default false,
  served_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists suspensions_team_idx on suspensions (team_id);
create index if not exists suspensions_player_idx on suspensions (player_name);
create index if not exists suspensions_is_served_idx on suspensions (is_served);

-- ============================================================
-- app_settings
-- ============================================================
create table if not exists app_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into app_settings (key, value) values
  ('tournament_name', 'FIFA Dynamics League'),
  ('yellow_cards_for_suspension', '3'),
  ('reset_yellow_cards_before_knockout', 'true'),
  ('group_stage_qualifiers', '4')
on conflict (key) do nothing;

-- ============================================================
-- updated_at 自動更新トリガー
-- ============================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at on teams;
create trigger set_updated_at before update on teams
  for each row execute function set_updated_at();

drop trigger if exists set_updated_at on matches;
create trigger set_updated_at before update on matches
  for each row execute function set_updated_at();

drop trigger if exists set_updated_at on match_events;
create trigger set_updated_at before update on match_events
  for each row execute function set_updated_at();

drop trigger if exists set_updated_at on suspensions;
create trigger set_updated_at before update on suspensions
  for each row execute function set_updated_at();

drop trigger if exists set_updated_at on app_settings;
create trigger set_updated_at before update on app_settings
  for each row execute function set_updated_at();
