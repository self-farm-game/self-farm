# Hosting on Vercel + Supabase

The prototype runs with **no backend** (mock data + localStorage). Ship it to
Vercel as-is, then add Supabase when you want real accounts and shared data.

## Part 1 — Deploy to Vercel

### 1. Put the code on GitHub
```bash
cd self-farm
git init
git add .
git commit -m "Self-Farm prototype"
# create an empty repo on github.com, then:
git remote add origin https://github.com/<you>/self-farm.git
git branch -M main
git push -u origin main
```

### 2. Import into Vercel
1. https://vercel.com → **Add New… → Project**.
2. Import your `self-farm` repo.
3. Framework preset **Next.js** (auto-detected). **No environment variables
   are needed** for the prototype.
4. **Deploy** → you get `https://self-farm.vercel.app`.

Every push to `main` redeploys; pull requests get preview URLs.

## Part 2 — Add Supabase (when ready)

### 1. Create the project
https://supabase.com → **New project**. Copy the **Project URL** and **anon
public** key (Project Settings → API).

### 2. Create the tables
Supabase → **SQL Editor** → paste `lib/supabase/schema.sql` → **Run**. Creates
players, quests, checkin_sessions, quest_attempts, items, player_items, runes,
player_runes and seeds starter quests.

### 3. Env vars
Local `.env.local` (copy `.env.example`):
```
NEXT_PUBLIC_SUPABASE_URL=https://YOURPROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```
Vercel → Settings → **Environment Variables** → add the same two for Production
and Preview → redeploy.

### 4. Connect
```bash
npm i @supabase/supabase-js
```
Uncomment `createClient` in `lib/supabase/client.ts`, then swap the localStorage
reads/writes in `lib/store/game.tsx` for Supabase queries, table by table
(players → sessions → attempts). The store already mirrors the schema.

### 5. Auth + RLS (before launch)
The schema enables RLS but ships without per-user policies. Add Supabase Auth and
policies like `player_id = auth.uid()` before any real launch.
