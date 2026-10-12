// One place that decides which language a quest speaks.
//
// quests-v2.ts stays structural truth (ids, moods, xp, tiers) and holds the
// Ukrainian words; quests-v2.en.ts holds the English ones. Everything that
// shows a quest, a mood or an outcome on screen goes through here, so a new
// language means one more file and nothing else.
//
// A missing translation falls back to Ukrainian rather than to a key: better
// a word in the wrong language than a blank card.

import type { Lang } from "@/lib/mock-data/i18n";
import {
  MOODS,
  MOOD_BY_KEY,
  OUTCOMES,
  QUEST_BY_ID,
  type MoodKey,
  type MoodOption,
  type OutcomeKey,
  type Quest,
} from "@/lib/mock-data/quests-v2";
import { MOOD_EN, OUTCOME_EN, QUEST_EN } from "@/lib/mock-data/quests-v2.en";

/** uk and uk_raw share the quest text; only Бомбом's own lines differ. */
export const isEn = (lang: Lang) => lang === "en";

/** The same quest, speaking the player's language. */
export function localizeQuest(lang: Lang, q: Quest): Quest {
  if (!isEn(lang)) return q;
  const en = QUEST_EN[q.id];
  return en ? { ...q, ...en } : q;
}

/** Quest by id, already localized. Undefined for an id we no longer ship. */
export function questById(lang: Lang, id: string): Quest | undefined {
  const q = QUEST_BY_ID[id];
  return q ? localizeQuest(lang, q) : undefined;
}

export function moodLabel(lang: Lang, key: MoodKey | string | null | undefined): string {
  if (!key) return "";
  if (isEn(lang)) return MOOD_EN[key as MoodKey] || MOOD_BY_KEY[key]?.label || "";
  return MOOD_BY_KEY[key]?.label || "";
}

/** The check-in list, in order, with localized labels. */
export function moodsFor(lang: Lang): MoodOption[] {
  if (!isEn(lang)) return MOODS;
  return MOODS.map((m) => ({ ...m, label: MOOD_EN[m.key] || m.label }));
}

export type Outcome = { key: OutcomeKey; icon: string; label: string; note: string };

export function outcomesFor(lang: Lang): Outcome[] {
  return OUTCOMES.map((o) =>
    isEn(lang) ? { ...o, ...(OUTCOME_EN[o.key] || {}) } : { ...o },
  );
}

export function outcomeLabel(lang: Lang, key: OutcomeKey | string): string {
  const o = OUTCOMES.find((x) => x.key === key);
  if (!o) return String(key);
  return isEn(lang) ? OUTCOME_EN[o.key]?.label || o.label : o.label;
}
