# Dev notes

## State / flow
- One store, `lib/store/game.tsx` (React context + localStorage, key
  `self-farm-state-v1`). Seeded to match the design (day 14, level 2, streak 3,
  148 XP, 7 found items, 1 seeded journal day).
- The check-in→quest→reward flow is **local state inside `garden/page.tsx`**
  because every flow screen belongs to the Garden tab (matches the design's
  `_activeTab` mapping). Navigating to another tab mid-flow is fine; the durable
  data already committed lives in the store.
- Inventory ("Знахідки") is a Garden sub-screen, not a route/tab (per rules).

## Things deliberately mocked for this stage
- Rune progress on the reward screen is a representative "Руна Руху · 2/3"; the
  Runes tab shows the full mock tree. Real rune computation: see data-model.md.
- Questbook categories/filters are visual (not yet filtering the list).
- "9:41" status time is decorative (matches design). "ДЕНЬ N" and "🔥 streak"
  are real (from the store).
- Quest suggestions show all three; matching by state/energy is a TODO
  (`targetStates`/`energyFit` already exist on the data).

## Assets
- `tree.png`, `bombom.png` are the design's sprites. `wood-plank.png` tiles the
  walls. The original garden **background was watermarked stock and was removed**
  — the sky/grass/soil scene is drawn in CSS in `TreeScene` (garden/page.tsx).
  Drop a licensed pixel background into `public/assets/backgrounds/` and swap it
  in if you want a richer scene.

## Sound
- `lib/sound/sound.ts` synthesizes SFX with Web Audio (no files). Muted flag is
  driven by Cabin → Звук and persisted in the store. Audio context resumes on
  first user gesture (browser policy) — the first tap may be silent.

## Known TODO / next
- Filter Questbook + Journal by the selected chip.
- Real quest matching from `targetStates` / `energyFit`.
- Compute runes from sessions/attempts; unlock + celebrate.
- Supabase persistence + Auth + RLS (docs/hosting-vercel-supabase.md).
- Optional: editable player/tree name in Cabin.

## Persistence (Supabase cloud save)
- `lib/store/game.tsx` hydrates from localStorage first, then (if Supabase env
  vars are set) signs in anonymously and loads `player_saves`. Changes autosave:
  localStorage immediately + debounced cloud upsert (~800ms).
- `lib/supabase/client.ts` — singleton browser client; null if env missing.
- `lib/supabase/persistence.ts` — `ensureAuth()` (anonymous), `loadRemote`,
  `saveRemote`. Table `player_saves(user_id pk, state jsonb, updated_at)` with
  RLS `auth.uid() = user_id`. Enable Authentication → Providers → Anonymous.
- Without env vars everything still works on localStorage only.

## Tree growth (staged)
- `components/garden/TreeStages.tsx` draws a pixel oak in 6 stages (acorn,
  sprout, sapling, young oak, oak, grand oak) tied to `levelInfo().levelNum`,
  with slight continuous scaling by `pct` and a wind sway. XP thresholds in
  `lib/utils/xp.ts`. The old single `tree.png` is no longer used in the scene
  (kept in /public/assets/sprites if you want it back).

## Auth (optional email/password) + fast load
- Default is anonymous (registration-free). `lib/store/game.tsx` exposes
  `auth {ready,email,isAnonymous}` and `signUp / signIn / signOut`.
  - signUp = `linkEmail` (updateUser) → upgrades the anonymous user, keeps id +
    progress. Requires Supabase "Confirm email" OFF for instant pre-beta.
  - signIn = `signInWithPassword` then loads that account's save (switches account).
  - signOut = sign out + new anonymous session.
  - UI lives in Cabin (module-level AuthSection/AuthForm). Hidden when Supabase
    isn't configured.
- **Load optimization:** the store now hydrates INSTANTLY from localStorage and
  sets `hydrated=true` with no network on the critical path; Supabase auth +
  reconcile run in the background. If the device already had a local save it is
  trusted and pushed up; a fresh device pulls remote. This removed the long
  startup wait that came from awaiting anonymous sign-in before first paint.
- Sprite weight cut: bombom.png ~632KB→~126KB; tree.png (unused in scene) shrunk.

## UPDATE — registration is now mandatory
- No anonymous play. `lib/supabase/persistence.ts` → `getSessionUser` (ignores
  any leftover anonymous session), `registerEmail` (real `signUp`), `signInEmail`,
  `signOutUser`.
- `lib/store/game.tsx`: on load, if Supabase is configured and there is no real
  session → `auth.isAnonymous = true`. `components/layout/GameShell.tsx` then
  renders `components/auth/AuthGate.tsx` instead of the game (loader shown until
  `auth.ready`). signUp/signIn open the gate; signOut closes it.
- Per-user localStorage cache key `self-farm-state-v1:<uid>` so accounts on one
  browser don't mix. New account → fresh state → onboarding; returning → cloud save.
- Requires Email provider enabled + "Confirm email" OFF (instant sign-up).
- If env vars are missing the gate is bypassed (local-only dev mode).

## UPDATE — perf + desktop + persistent login
- **Fonts self-hosted** via `next/font/google` (Pixelify Sans, latin+cyrillic) in
  `app/layout.tsx` → no render-blocking external CSS, no FOIT. The old
  `@import` was removed; `--font-pixel` drives `body`.
- **Persistent login:** Supabase client uses `persistSession` + `autoRefreshToken`,
  so a returning visitor is restored from the stored session — credentials are
  only entered at registration / first login. The gate shows only when there is
  no valid (non-anonymous) session.
- **Desktop interface:** responsive sidebar layout (see design-system.md). Mobile
  unchanged.
- Image weights already reduced (bombom/tree). Startup hydrates instantly from
  per-user localStorage cache; cloud reconciles in the background.

## UPDATE — Google OAuth + tablet responsive
- Google sign-in: `signInWithGoogle` (persistence) → `signInGoogle` (store) →
  button in `components/auth/AuthGate.tsx`. Auth is now driven by
  `subscribeAuth` (onAuthStateChange) so OAuth return / email login / restore /
  sign-out all reconcile through one path. Requires Google provider + redirect
  URLs configured in Supabase (see hosting doc Part 4).
- Responsive: breakpoints moved to a clean split — phones <768px (full-bleed),
  tablets+desktop ≥768px (sidebar landscape). Fixes the tablet layout.
