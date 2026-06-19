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
