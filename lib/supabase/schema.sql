-- Self-Farm — Supabase schema (run in the SQL editor of your project)
-- Mirrors lib/types/index.ts. RLS policies are minimal/dev-friendly; tighten
-- before any real launch.

create extension if not exists "pgcrypto";

-- ---------- players ----------
create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Мандрівник',
  tree_name text,
  tree_level int not null default 1,
  xp int not null default 0,
  streak int not null default 0,
  day int not null default 1,
  muted boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- quests (content; seeded, read-only for players) ----------
create table if not exists quests (
  id text primary key,
  title text not null,
  description text,
  why text,
  icon text,
  duration_minutes int not null default 2,
  category text,
  base_xp int not null default 10,
  target_states text[] not null default '{}',
  energy_fit int[] not null default '{}',
  is_unlocked boolean not null default true,
  unlock_hint text
);

-- ---------- check-in sessions ----------
create table if not exists checkin_sessions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  created_at timestamptz not null default now(),
  day int not null default 1,
  state text not null,
  states text[] not null default '{}',
  energy int,
  tension int,
  body text[] not null default '{}',
  note text,
  suggested_quest_ids text[] not null default '{}',
  selected_quest_id text references quests(id),
  completed_quest_attempt_id uuid
);

-- ---------- quest attempts ----------
create table if not exists quest_attempts (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  quest_id text references quests(id),
  quest_title text,
  checkin_session_id uuid references checkin_sessions(id) on delete set null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  day int not null default 1,
  status text not null default 'active', -- active | completed | abandoned
  after_state text,                      -- lighter | same | heavier | unknown
  reflection_note text,
  xp_awarded int,
  item_drop_id text
);

-- ---------- items (content) ----------
create table if not exists items (
  id text primary key,
  name text not null,
  rarity text not null default 'common', -- common | rare | strange
  description text,
  icon text
);

-- ---------- player_items (inventory) ----------
create table if not exists player_items (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  item_id text not null references items(id),
  source text,
  created_at timestamptz not null default now()
);

-- ---------- runes (content) + player_runes (progress) ----------
create table if not exists runes (
  id text primary key,
  title text not null,
  description text,
  category text not null, -- state | action | return | clarity
  required int not null default 1
);

create table if not exists player_runes (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  rune_id text not null references runes(id),
  current int not null default 0,
  is_unlocked boolean not null default false,
  unlocked_at timestamptz
);

-- ---------- enable RLS (add auth-based policies when auth is added) ----------
alter table players enable row level security;
alter table checkin_sessions enable row level security;
alter table quest_attempts enable row level security;
alter table player_items enable row level security;
alter table player_runes enable row level security;

-- ---------- seed quest content (the prototype's mock quests) ----------
insert into quests (id, title, description, icon, duration_minutes, category, base_xp, target_states, energy_fit) values
  ('window-2min',   'Вікно на 2 хвилини', 'Підійди до вікна, знайди 3 нерухомі речі, видихни довше, ніж вдихаєш.', '🪟', 2, 'Шум', 12, '{"Шумно","Тривожно"}', '{1,2,3}'),
  ('water-10steps', 'Вода + 10 кроків',  'Налий склянку води, випий повільно, пройди 10 кроків.',               '💧', 3, 'Тіло', 10, '{"Втома","Порожньо"}', '{1,2}'),
  ('shoulders-down','Плечі вниз',        'Підніми плечі до вух і кинь їх вниз з видихом. Тричі.',                '🪶', 1, 'Тіло', 8,  '{"Напружено"}', '{1,2,3,4}'),
  ('tidy-one',      'Прибери один предмет','Постав на місце рівно одну річ. Не кімнату — одну річ.',             '🧹', 3, 'Болото', 10, '{"Порожньо"}', '{2,3}')
on conflict (id) do nothing;
