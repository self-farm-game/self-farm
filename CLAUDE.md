# CLAUDE.md — project memory for Self-Farm

## What this is
Self-Farm is a small, warm, pixel-art game (Next.js). The player notices their
state, does one tiny real-world quest, returns, marks what changed, and slowly
grows ONE oak tree. NPC **Бомбом** (a grumpy-but-kind gnome/mage) guides them.
It is **not** a medical/therapy/productivity/habit app and not a tamagotchi.

Internal positioning only (never main UI copy): "не self-harm, а self-farm".

## Hard product rules (do not break)
- The single main action on Garden is **«Як ти зараз?»**. No "track state",
  "do quest", "write journal", "health" buttons on Garden.
- Writing text is **always optional**. A check-in must be doable in ~10–15s by taps.
- 5 tabs only: **Garden · Questbook · Farm Journal · Runes · Cabin**.
  Inventory ("Знахідки") is a Garden sub-screen, NOT a tab.
- Do not punish missed days. Reward returning. The tree never withers from
  inactivity — it grows from returning and trying, not from being happy. Growth is staged
  (acorn → grand oak, 6 stages) via components/garden/TreeStages.tsx (SVG).
- Keep medical/diagnostic language out of the UI. Use the game vernacular:
  блиск, стрічки, дзижчання, шум, напруга, пусте поле, баклажанне поле,
  коріння, руни, маленький рух.
- Desktop is a centered game window on a decorative dark field — never a
  stretched vertical mobile with empty sides.

## Stack & layout
Next.js 14 App Router, TypeScript, mostly inline pixel styles (faithful to the
shared design) + a little Tailwind config kept for future use.
- `app/` — routes: `/onboarding`, `/(app)/{garden,questbook,journal,runes,cabin}`.
  The check-in → quest → reward flow lives as local state inside `garden/page.tsx`
  (it belongs to the Garden tab).
- `components/ui/primitives.tsx` — WoodButton, ParchButton, Chip, HeartBar, Stars,
  BackRow, BombomBanner, ScreenTitle.
- `components/layout/` — GameShell (device frame + wall + top bar + nav), BottomNav.
- `lib/store/game.tsx` — single source of truth, persisted to localStorage,
  shaped to map 1:1 onto Supabase later.
- `lib/sound/sound.ts` — synthesized Web Audio SFX (no audio files); muted flag
  driven by Cabin settings.
- `lib/mock-data/` — quests, runes, items, content (states/energy/onboarding/etc).
- `lib/supabase/` — client stub + schema.sql (run later).
- `public/assets/` — pixel sprites (tree, bombom) + wood texture. The garden sky
  scene is drawn in CSS (the original stock background was watermarked, removed).

## Data persistence
`useGame()` exposes state + actions (plantTree, recordSession, toggleMute, reset,
nextBombom). `recordSession` awards XP, may drop an item, and prepends a Farm
Journal entry under "Сьогодні".
- State is cached in `localStorage` AND, when Supabase env vars are present,
  synced to the cloud per **anonymous** auth user (debounced ~800ms) via
  `lib/supabase/persistence.ts` → table `player_saves` (jsonb `state`, RLS).
- No Supabase env vars → app runs localStorage-only (still deployable).
- The whole GameState is one jsonb blob for now; normalize later if needed.

## When extending
- New quests/items/runes → add to `lib/mock-data/*` (and seed in schema.sql).
- Real persistence → see `docs/data-model.md` + `lib/supabase/schema.sql`.
- Keep the tone: warm, grumpy, practical, non-clinical. Бомбом does not coach.
