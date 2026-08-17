// The states a person can pick at check-in.
//
// `priority` gives the DEFAULT order (higher = shown earlier), tuned so the most
// commonly reported feelings surface first. This is only about *display order* —
// it never changes what a state means or which quests it matches. Once a person
// starts checking in, their own most-picked states float to the front (see
// orderStates() in lib/utils/states.ts, which blends personal counts with this
// base priority).

export interface StateDef {
  key: string; // stable id, also used for personal counts
  label: string; // Ukrainian label (shown on the chip)
  en: string; // English label
  group: "hard" | "low" | "restless" | "ok"; // colour family
  priority: number; // default ordering weight
}

export const STATE_DEFS: StateDef[] = [
  // most common first (higher priority)
  { key: "tired", label: "Втома", group: "low", priority: 100, en: "Tired" },
  { key: "anxious", label: "Тривожно", group: "hard", priority: 96, en: "Anxious" },
  { key: "overwhelmed", label: "Все навалилось", group: "hard", priority: 90, en: "Overwhelmed" },
  { key: "noisy", label: "Шумно в голові", group: "restless", priority: 88, en: "Noisy head" },
  { key: "sad", label: "Сумно", group: "low", priority: 84, en: "Sad" },
  { key: "empty", label: "Порожньо", group: "low", priority: 82, en: "Empty" },
  { key: "tense", label: "Напружено", group: "restless", priority: 80, en: "Tense" },
  { key: "unmotivated", label: "Немає сил почати", group: "low", priority: 78, en: "Can't start" },
  { key: "angry", label: "Злюсь", group: "hard", priority: 74, en: "Angry" },
  { key: "irritated", label: "Дратує все", group: "hard", priority: 72, en: "Irritated" },
  { key: "lonely", label: "Самотньо", group: "low", priority: 70, en: "Lonely" },
  { key: "restless", label: "Не всидіти", group: "restless", priority: 66, en: "Restless" },
  { key: "foggy", label: "Туман, не думається", group: "restless", priority: 64, en: "Foggy" },
  { key: "guilty", label: "Провина", group: "hard", priority: 60, en: "Guilty" },
  { key: "scattered", label: "Розсіяно", group: "restless", priority: 58, en: "Scattered" },
  { key: "numb", label: "Заціпеніло", group: "low", priority: 54, en: "Numb" },
  { key: "wired", label: "Перезбуджено", group: "restless", priority: 50, en: "Wired" },
  { key: "bored", label: "Нудно", group: "low", priority: 46, en: "Bored" },
  { key: "insecure", label: "Невпевнено", group: "hard", priority: 44, en: "Insecure" },
  // neutral / good — lower default priority (less often the reason to open the app)
  { key: "ok", label: "Нормально", group: "ok", priority: 40, en: "Okay" },
  { key: "calm", label: "Спокійно", group: "ok", priority: 36, en: "Calm" },
  { key: "content", label: "Вдоволено", group: "ok", priority: 30, en: "Content" },
  { key: "hopeful", label: "Є надія", group: "ok", priority: 26, en: "Hopeful" },
  { key: "grateful", label: "Вдячно", group: "ok", priority: 22, en: "Grateful" },
  { key: "energized", label: "Є запал", group: "ok", priority: 18, en: "Energized" },
  { key: "unknown", label: "Не знаю", group: "ok", priority: 6, en: "Not sure" },
];

export const STATE_LABEL: Record<string, string> = Object.fromEntries(
  STATE_DEFS.map((s) => [s.key, s.label]),
);

export const GROUP_TINT: Record<StateDef["group"], string> = {
  hard: "#d4506a",
  low: "#6f7bd6",
  restless: "#c98a3a",
  ok: "#5fae5f",
};

import type { Lang } from "@/lib/mock-data/i18n";
export function stateLabel(lang: Lang, key: string): string {
  const d = STATE_DEFS.find((s) => s.key === key);
  if (!d) return key;
  return lang === "en" ? d.en : d.label;
}
