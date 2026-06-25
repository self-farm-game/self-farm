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

## Part 2 — Supabase setup (required: accounts are mandatory)

The game now **requires registration** (email + password). Before playing, a
visitor sees an auth gate (Реєстрація / Вхід). Saves live in `player_saves`
under Row-Level Security, scoped to the signed-in user.

### 1. Create the project
https://supabase.com → **New project**. Copy the **Project URL** and the
**anon public** key (Settings → API Keys; the new `sb_publishable_...` or the
legacy `anon` key — either works for the client).

### 2. Enable the Email provider + make sign-up instant
Dashboard → **Authentication → Sign In / Providers → Email**:
- make sure **Email** is **enabled**,
- turn **OFF "Confirm email"** (so registration logs the user in immediately;
  otherwise they must click a confirmation link before they can play).

(Anonymous sign-ins are no longer used — you can leave that provider off.)

### 3. Create the table + policies
**SQL Editor** → paste `lib/supabase/schema.sql` → **Run**. Creates
`player_saves` (one jsonb `state` row per user) with RLS `auth.uid() = user_id`.

### 4. Environment variables
Local `.env.local` (copy `.env.example`):
```
NEXT_PUBLIC_SUPABASE_URL=https://YOURPROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...   (or legacy anon key)
```
Vercel → Settings → **Environment Variables** → add the same two for Production
and Preview → **Redeploy**.

### 5. Verify
Open the app → you should see the auth gate → **Реєстрація** with any email +
6+ char password → you land in onboarding. In Supabase → **Table Editor →
player_saves** a row appears with your `state`. Log in on another device with
the same credentials to load the same garden.

### Notes
- If `NEXT_PUBLIC_*` env vars are missing, the app does **not** gate — it runs
  local-only (handy for dev). With them set on Vercel, registration is enforced.
- Whole game state is one `jsonb` blob for now (simple + robust for pre-beta);
  split into the optional normalized tables later if needed.
- `npm i` already includes `@supabase/supabase-js`.

## Part 4 — "Continue with Google" (OAuth)

The auth gate has a **Продовжити з Google** button (`signInWithOAuth`). To make it
work you enable Google as a provider in Supabase and register an OAuth client in
Google Cloud.

### 1. Create a Google OAuth client
Google Cloud Console → **APIs & Services → Credentials → Create Credentials →
OAuth client ID** → type **Web application**.
- **Authorized redirect URI:** the exact callback Supabase shows in its Google
  provider page — it looks like
  `https://YOURPROJECT.supabase.co/auth/v1/callback`.
- Create → copy the **Client ID** and **Client secret**.
(You may need to configure the OAuth consent screen first — External, add your
email as a test user for pre-beta.)

### 2. Enable Google in Supabase
Dashboard → **Authentication → Providers → Google** → enable → paste the
**Client ID** + **Client secret** → Save.

### 3. Allow your app URLs to receive the redirect
Dashboard → **Authentication → URL Configuration**:
- **Site URL:** your app URL (e.g. `https://self-farm-r7zn.vercel.app`).
- **Redirect URLs:** add the origins the app will redirect back to:
  - `https://self-farm-r7zn.vercel.app/**`
  - `http://localhost:3000/**` (for local dev)

The app calls Google with `redirectTo = window.location.origin`, so whatever
domain you open it on must be listed here, or the return will be rejected.

### How it behaves
Click **Продовжити з Google** → Google account picker → back to the app →
`detectSessionInUrl` + the auth listener pick up the session → the gate opens and
the player's cloud save loads (a brand-new Google user starts at onboarding).
Email/password still works alongside it.
