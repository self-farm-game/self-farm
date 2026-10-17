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

-- ────────────────────────── push-нагадування ──────────────────────────
-- Один рядок = одна підписка браузера. У людини їх може бути кілька:
-- ноутбук, телефон, другий браузер — і це нормально, кожен отримає своє.
--
-- Час нагадування зберігається тут, а не лише в стані гри, бо надсилає
-- його сервер, і йому треба знати і час, і часовий пояс людини.
create table if not exists push_subs (
  endpoint    text primary key,
  user_id     uuid references auth.users(id) on delete cascade,
  p256dh      text not null,
  auth        text not null,
  -- "HH:MM" у місцевому часі людини
  times       text[] not null default '{"20:00"}',
  -- IANA, напр. "Europe/Kiev" — за ним сервер рахує, котра в неї зараз
  tz          text not null default 'Europe/Kiev',
  lang        text not null default 'uk',
  enabled     boolean not null default true,
  last_sent   timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists push_subs_enabled_idx on push_subs (enabled) where enabled;

alter table push_subs enable row level security;

-- Людина порядкує лише своїми підписками. Розсилку робить service-role
-- ключ, який RLS обходить — тож окремої політики на читання всіх не треба.
drop policy if exists "own push subs" on push_subs;
create policy "own push subs" on push_subs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
