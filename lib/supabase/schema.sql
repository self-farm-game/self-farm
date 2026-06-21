-- Self-Farm — Supabase schema. Run this in the SQL Editor of your project.
-- ============================================================================
-- ACTIVE (pre-beta): one row per anonymous player holding the whole game state.
-- ============================================================================
-- Auth model: anonymous sign-in (no email/registration). Enable it first:
--   Dashboard → Authentication → Providers → Anonymous → ON.
-- Each visitor gets a registration-free auth user; RLS scopes saves to them.

create table if not exists player_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table player_saves enable row level security;

-- a player can only read/write their own save
drop policy if exists "player_saves_select_own" on player_saves;
create policy "player_saves_select_own" on player_saves
  for select using (auth.uid() = user_id);

drop policy if exists "player_saves_insert_own" on player_saves;
create policy "player_saves_insert_own" on player_saves
  for insert with check (auth.uid() = user_id);

drop policy if exists "player_saves_update_own" on player_saves;
create policy "player_saves_update_own" on player_saves
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- OPTIONAL (later): normalized tables, if/when you split the jsonb blob into
-- real relational data + proper accounts. Safe to run now; unused by pre-beta.
-- ============================================================================
create extension if not exists "pgcrypto";

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

create table if not exists items (
  id text primary key,
  name text not null,
  rarity text not null default 'common',
  description text,
  icon text
);

create table if not exists runes (
  id text primary key,
  title text not null,
  description text,
  category text not null,
  required int not null default 1
);

-- seed quest content (matches the prototype's mock quests)
insert into quests (id, title, description, icon, duration_minutes, category, base_xp, target_states, energy_fit) values
  ('window-2min',   'Вікно на 2 хвилини', 'Підійди до вікна, знайди 3 нерухомі речі, видихни довше, ніж вдихаєш.', '🪟', 2, 'Шум', 12, '{"Шумно","Тривожно"}', '{1,2,3}'),
  ('water-10steps', 'Вода + 10 кроків',  'Налий склянку води, випий повільно, пройди 10 кроків.',               '💧', 3, 'Тіло', 10, '{"Втома","Порожньо"}', '{1,2}'),
  ('shoulders-down','Плечі вниз',        'Підніми плечі до вух і кинь їх вниз з видихом. Тричі.',                '🪶', 1, 'Тіло', 8,  '{"Напружено"}', '{1,2,3,4}'),
  ('tidy-one',      'Прибери один предмет','Постав на місце рівно одну річ. Не кімнату — одну річ.',             '🧹', 3, 'Болото', 10, '{"Порожньо"}', '{2,3}')
on conflict (id) do nothing;
