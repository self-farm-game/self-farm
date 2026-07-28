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

## FIX — Google OAuth bounced back to the auth gate
Symptom: sign in with Google returned to the app, then immediately showed the
register/login screen again.

Cause: Google redirects to `/` with `?code=...` (PKCE). `app/page.tsx` ran
`router.replace()` as soon as `hydrated` flipped — stripping `?code=` before
Supabase could exchange it — so no session was ever created and the gate
re-rendered.

Fix:
- `lib/supabase/client.ts`: explicit `flowType: "pkce"` (+ detectSessionInUrl).
- `lib/supabase/persistence.ts`: `hasOAuthParams()` and
  `completeOAuthRedirect()` → awaits `exchangeCodeForSession(location.href)`,
  then cleans the URL via `history.replaceState` (so a refresh can't reuse a
  spent code). Also reads `error_description` from Google.
- `lib/store/game.tsx`: when OAuth params are present, the auth subscription is
  started only AFTER the exchange resolves; the failure reason is kept in
  `auth.error`.
- `app/page.tsx`: skips the redirect while OAuth params are in the URL.
- `components/auth/AuthGate.tsx`: renders `auth.error`, so a failed Google
  return now states the reason instead of silently showing the gate.

## FIX 2 — "PKCE code verifier not found in storage"
Cause: the client was set to `flowType: "pkce"` AND `detectSessionInUrl: true`,
while `completeOAuthRedirect()` also called `exchangeCodeForSession()`. Two
consumers raced for the same one-time code/verifier; the loser threw
"PKCE code verifier not found in storage" (it is also thrown whenever the flow
starts on one origin and finishes on another, since the verifier lives in that
origin's localStorage).

Fix: this app is client-only (no server auth), so PKCE buys nothing here.
- `client.ts` → `flowType: "implicit"` (token arrives in the URL hash, no
  verifier storage involved), `detectSessionInUrl` still true.
- `completeOAuthRedirect()` no longer exchanges anything. It reads any
  `error_description` from the URL and then just POLLS `getSession()` (20×150ms)
  until the session Supabase parsed from the URL appears, then cleans the URL.
If PKCE is ever needed (real SSR auth), switch to `@supabase/ssr` so the verifier
is stored in cookies on both server and client — not this manual approach.

## NOTE — Google always signed in as the same account
Google has no separate "register" vs "login": the first OAuth sign-in creates the
user, later ones just sign in. That is why the same button works on both tabs.

If the browser already has a Google session, Google skips the account chooser and
silently reuses it, so every attempt lands on the same user. Fixed by passing
`queryParams: { prompt: "select_account" }` to `signInWithOAuth`, which forces the
picker every time.

Separate limit: while the Google Cloud app is in **Testing**, only emails listed
in Audience → Test users can complete sign-in; any other account is rejected by
Google before it ever reaches Supabase. Add testers there, or publish the app.

## FIX 3 — Google always landed on the same account
Symptom: different users existed in Supabase, but the app always ended up signed
in as the first one.

Cause: `completeOAuthRedirect()` only checked "is there a session?" — the
PREVIOUSLY stored session answered yes instantly, the function then cleaned the
URL and threw away the freshly returned tokens of the account just chosen.

Fix: `detectSessionInUrl: false` (so there is exactly one consumer of the URL)
plus explicit `setSession({ access_token, refresh_token })` parsed from the
returned hash. The new account now always replaces the old one deterministically.
Combined with `prompt: "select_account"`, each sign-in asks which Google account
to use and lands on exactly that one.


## Quests v2 — state-matched + adaptive state order
- `lib/mock-data/states.ts` — 26 states with `group` (colour) + `priority`
  (default order, most-common-first). `STATE_LABEL`, `GROUP_TINT` helpers.
- `lib/utils/states.ts` — `orderStates(counts)` blends the user's own pick counts
  with base priority so their frequent feelings float up (display only, never
  changes meaning). `toggleState` handles the "Не знаю" reset.
- `lib/mock-data/quests.ts` — 21 quests, each tagged `states: string[]` and some
  `maintenance: true` (good for holding an ok state). `suggestQuests(keys, n)`
  ranks by number of matched states, falling back to maintenance quests when the
  person feels fine or nothing matches. `STARTER_QUEST_ID` is the single quest a
  brand-new player is nudged toward. `QUESTBOOK`/`QUESTBOOK_CATEGORIES` are now
  derived from the library (+ a few locked teasers).
- Store: `GameState.stateCounts` persists per-state pick counts;
  `recordSession({ stateKeys })` tallies them; ordering reads them back.
- Garden flow: check-in shows the ordered, colour-tinted chips; "Далі" is gated
  until a state is chosen; quest suggestions are `suggestQuests(chosenStates)`,
  labelled "підібрано під: …". Home nudges first-time players to start from a
  state so paths open up.

## Quests v3 — daily limit + difficulty that scales with the tree
- **Daily limit (5/day).** `GameState` gains `dayKey` (YYYY-MM-DD) + `dailyDone`.
  `recordSession` rolls the counter over on a new calendar day. Store exposes
  `dailyDone` / `dailyLeft` (via `DAILY_QUEST_LIMIT`, `todayKey()`). Garden home
  swaps the «Як ти зараз?» CTA for a "На сьогодні досить 🌙" card once the 5 are
  used, and shows "лишилось стежок: N з 5" otherwise. Resets automatically at
  local midnight; per-account (stored in player_saves).
- **Difficulty tiers.** Each quest has `tier` (1 gentle · 2 stretch · 3 bold) and
  `minLevel` (tree level to unlock). New harder quests: call-someone, say-no,
  ask-help (tier 2); talk-stranger, solo-outing, hard-conversation (tier 3, e.g.
  «Заговорити з незнайомцем»). `suggestQuests(states, level, n)` only offers
  unlocked quests, nudges toward the hardest unlocked tier, but always keeps one
  tier-1 gentle option. Cards show a «↗ виклик» / «🔥 сміливий» badge.
- So challenge rises as the tree grows, while the daily cap keeps it to small,
  sustainable returns rather than grinding.

## Quests v4 — Questbook is now a daily hub (3h check-in window)
- Removed the category filter and the static browsable list from
  `app/(app)/questbook/page.tsx`.
- New store fields on `GameState`: `activeQuestIds`, `activeStates`,
  `activeUntil` (epoch ms), `doneToday[{id,title,icon,time}]`.
  `CHECKIN_WINDOW_MS = 3h`. `openCheckin(stateKeys, questIds)` stamps the mood
  and unlocks its matched quests until `activeUntil`; `recordSession` records the
  finished quest into `doneToday` and removes it from `activeQuestIds`. Both roll
  over on a new calendar day. Store exposes `checkinLeftMs` + `openCheckin`.
- Garden calls `openCheckin(states, suggestQuests(...).ids)` when leaving the
  state screen, and passes `questId`/`questIcon` to `recordSession`.
- Questbook shows: a status banner (N/5 done, mood-active countdown); when a
  check-in is active → the matched **Актуальні** quests (with a live "ще N хв"),
  else → the always-available **starter** quest + a locked "введи настрій" card;
  a **Виконано сьогодні** list; and a "На сьогодні досить" state at the daily cap.
  Tapping any quest routes to /garden to run the check-in/quest flow.
- `QUESTBOOK`/`QUESTBOOK_CATEGORIES` are now unused by the UI (kept exported).

## Quests v5 — run from Questbook + 3h check-in gap
- Store: `canCheckin` (true only once the 3h window from the last check-in has
  elapsed) and `nextCheckinInMs`. `openCheckin` now no-ops if called during the
  window, so check-ins are spaced ≥3h apart. Values exposed on context.
- Deep link: `/garden?quest=<id>` opens that quest's detail immediately (garden
  reads the param on mount, reuses `activeStates` to tag the session, then cleans
  the URL). Questbook "Виконати →" uses this to run a quest without walking the
  whole check-in flow again.
- Questbook: always shows the starter quest with a working "Виконати →"; after a
  check-in shows the matched quests (each runnable); shows a check-in prompt when
  none active and `canCheckin`, or a "новий чек-ін за N" cooldown notice, or the
  daily-limit card. Garden home CTA is likewise gated by `canCheckin`.

## Quests v6 — base + 3-per-check-in, 3h gap, no daily cap, bigger library
- Model change: there is NO daily cap. The **starter quest is always runnable**;
  each **check-in adds 3** matched quests (`QUESTS_PER_CHECKIN`). A new check-in
  is allowed only after `CHECKIN_GAP_MS` (3h) since the last one — tracked via
  `state.lastCheckinAt`. `canCheckin` / `nextCheckinInMs` drive both the garden
  CTA and the Questbook. `dailyLeft` now means "quests remaining in the active
  set"; the old DAILY_QUEST_LIMIT is legacy/unused for gating.
- Library grown to ~43 quests across Спокій/Тіло/Тепло/Розрядка/Ясність/Лад/
  Опора/Рух/Сміливість, tiers 1–3. `suggestQuests` adds light random jitter among
  equally-fitting quests so the 3 offered rotate between check-ins.
- Questbook: base quest (Виконати →) always; the active 3 after a check-in (each
  Виконати →, deep-linking to /garden?quest=id); a check-in prompt when allowed,
  else a cooldown card; plus "Виконано сьогодні".

## Quests v7 — check-in gated by clearing the set; XP capped per 3h window
- **Check-in is allowed only when the active set is empty** (`canCheckin =
  activeQuestIds.length === 0`) — NOT on a timer. Finish the base + 3 to unlock
  the next mood.
- **XP window:** `XP_WINDOW_MS = 3h`, `XP_WINDOW_CAP = 5`. Only the first 5
  quests completed within a rolling 3h window grant XP; further quests still
  count as done (journal, doneToday, tree unaffected by them) but grant 0 XP and
  are labelled "без XP (ліміт вікна)". Tracked via `state.xpWindowStart` +
  `xpInWindow`; window resets when 3h elapse. `recordSession` computes granted XP
  from live state and returns it (reward screen shows the real amount, incl. 0).
- Store exposes `xpLeft` (XP-earning quests left in the window) and
  `xpWindowLeftMs`. Garden + Questbook show "XP лишилось: N/5" and gate the
  check-in on a cleared set.
