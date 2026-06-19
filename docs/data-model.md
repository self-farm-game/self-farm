# Data model

Types live in `lib/types/index.ts`; the SQL mirror is `lib/supabase/schema.sql`.
The local store (`lib/store/game.tsx`) is the mock stand-in and keeps the same shape.

| Entity | Purpose | Key fields |
|---|---|---|
| Player | the human + their tree | name, treeLevel, xp, streak, day, muted |
| Quest | content (seeded) | id, title, durationMinutes, category, baseXp, targetStates, energyFit, isUnlocked, unlockHint |
| CheckInSession | one "Як ти зараз?" entry | state(s), energy 1–5, tension 1–3, note?, suggestedQuestIds, selectedQuestId |
| QuestAttempt | taking/finishing a quest | questId, checkInSessionId?, startedAt, completedAt?, status, afterState, reflectionNote?, xpAwarded, itemDropId? |
| Item / PlayerItem | found objects + inventory | name, rarity(common/rare/strange), description |
| Rune / PlayerRune | skill-tree progress | category(state/action/return/clarity), current/required, isUnlocked |

## How the store records a session
`recordSession()` (in the store) is called at the end of the flow. It:
1. awards `questXp`,
2. rolls an item drop (mock probability) and adds it to inventory,
3. prepends a Farm Journal entry under "Сьогодні".

When moving to Supabase, this becomes: insert `checkin_sessions`, insert
`quest_attempts`, upsert `player_items`, update `players.xp`, recompute
`player_runes`.

## Rune logic (mock now, computable later)
- State runes: counts of check-ins with certain states.
- Action runes: counts of completed quests by category.
- Return runes: distinct active days (+ "after a skipped day").
- Clarity runes: optional notes / reflections written.
