# Self-Farm 🌳

A small pixel-art game about returning to yourself: notice your state, take one
tiny real-world quest, come back and mark what changed, and slowly grow one oak.
Built with Next.js (App Router) + TypeScript.

> Internal positioning only, never shown in UI: *не self-harm, а self-farm.*
> Одне дерево. Один рух.

## Pre-beta (current build)
This is a **pre-beta** meant for hosting a test link on Vercel.
- **No login screen / no registration.**
- Every visitor **starts from zero**: acorn (stage 1), 0 XP, empty journal,
  empty inventory, no runes, streak 0, day 1. The tree grows in 6 visible stages
  (acorn → sprout → sapling → young oak → oak → grand oak).
- **Accounts are required.** Players register / log in with email + password
  (auth gate before the game). Saves sync to Supabase (`player_saves`, RLS) and
  follow the account across devices. If the Supabase env vars are absent, the app
  runs local-only without a gate (dev convenience). Setup + the one toggle to
  flip ("Confirm email" OFF): `docs/hosting-vercel-supabase.md`.

## Run locally
```bash
npm install
npm run dev
# open http://localhost:3000
```
Node 18.17+ (or 20+) recommended.

No environment variables are needed to run — the prototype uses mock data and
`localStorage`. Supabase is optional and wired in later (see below).

## What works
- Onboarding lore (3 beats) → plant the tree → enter the Garden.
- Garden: pixel tree scene, level + XP heart-bar, the one CTA **«Як ти зараз?»**,
  Бомбом with tap-to-cycle lines, and the **Знахідки** (inventory) sub-screen.
- Check-in flow (state → energy/tension → optional words → quest suggestions),
  fully tappable; writing is optional.
- Quest detail → active (timer) → "Що змінилось?" → optional note → reward
  (XP, possible item drop, rune progress).
- Farm Journal timeline (new sessions are saved here), Questbook (unlocked/locked),
  Runes (root-system skill tree + "дерево помітило" insights), Cabin (profile,
  stats, sound toggle, reset).
- Sound effects via Web Audio (toggle in Cabin).
- Responsive: full-bleed on phones; a centered game window on desktop.

## Project structure
```
app/                     routes (App Router)
  onboarding/            intro lore
  (app)/{garden,questbook,journal,runes,cabin}/
components/{ui,layout}/  pixel UI primitives + shell/nav
lib/
  store/game.tsx         state + localStorage (Supabase-ready)
  sound/sound.ts         Web Audio SFX
  mock-data/             quests, runes, items, content
  supabase/              client stub + schema.sql
  types/ utils/
public/assets/           sprites + wood texture
docs/                    brief, lore, data-model, design-system, dev-notes, hosting
```

## Deploy
See **docs/hosting-vercel-supabase.md** for full step-by-step. Short version:
push to GitHub → import into Vercel → deploy (no env vars required for the
prototype). Add Supabase later when you want real accounts/persistence.
