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

## Part 2 — Turn on cloud save with Supabase

Cloud save is already wired in the code. It uses **anonymous sign-in** (no login
screen, no registration): each visitor silently gets a Supabase auth user and
their game state is stored in `player_saves` under Row-Level Security. Until you
set the env vars below, the app runs on `localStorage` only.

### 1. Create the project
https://supabase.com → **New project**. Copy the **Project URL** and the
**anon public** key (Project Settings → API).

### 2. Enable anonymous sign-ins
Dashboard → **Authentication → Providers → Anonymous → ON**. (Without this,
cloud save silently stays off and the app falls back to localStorage.)

### 3. Create the table + policies
**SQL Editor** → paste `lib/supabase/schema.sql` → **Run**. This creates
`player_saves` with RLS so each anonymous user only sees their own save.

### 4. Set environment variables
Local — create `.env.local` (copy `.env.example`):
```
NEXT_PUBLIC_SUPABASE_URL=https://YOURPROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```
Vercel → Project → **Settings → Environment Variables** → add the same two keys
for **Production** (and Preview) → **Redeploy**.

That's it — no extra code. On load the app signs in anonymously, loads the save
(if any), and autosaves changes (debounced). Saves persist across reloads on the
same browser/device. To verify: play a bit, then in Supabase → **Table Editor →
player_saves** you should see a row with your `state` JSON.

### 5. Notes
- The whole game state is stored as one `jsonb` blob (`player_saves.state`). It is
  simple and robust for pre-beta; later you can split it into the optional
  normalized tables (also in `schema.sql`) and add real accounts.
- `npm i` already includes `@supabase/supabase-js`; nothing else to install.
- Anonymous users are per-device. To move a save between devices later you would
  add account linking (email/OAuth) — out of scope for pre-beta.

## Part 3 — Optional email/password accounts

Cloud save works anonymously by default. Players can optionally create an
account (Cabin → "Збережи свій сад") so their garden follows them across
devices. It's layered on top of the anonymous user, so **progress is preserved**
when they sign up (same Supabase user id, just upgraded with email+password).

### Make sign-up instant for pre-beta
By default Supabase requires email confirmation, which would block the
anonymous→permanent upgrade until the user clicks a link. For a test build,
turn it off:

- Dashboard → **Authentication → Sign In / Providers → Email** →
  turn **OFF "Confirm email"** → Save.

(Leave the **Email** provider itself enabled.) With confirmation off, "Створити"
in Cabin links the account immediately and the player keeps their tree.

### How it behaves
- **Створити** (while anonymous): links email+password to the current anonymous
  user → same id, progress kept, now reachable from other devices.
- **Увійти** (another device/browser): signs into that account and loads its
  cloud save, replacing the local anonymous one.
- **Вийти**: returns to a fresh anonymous player on this device.

No email/login UI appears for players who don't want it — anonymous play is
still the default. When you later want real email confirmation + password
reset, re-enable "Confirm email" and add a reset flow.
