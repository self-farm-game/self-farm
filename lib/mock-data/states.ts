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
  label: string; // shown on the chip
  group: "hard" | "low" | "restless" | "ok"; // colour family
  priority: number; // default ordering weight
}

export const STATE_DEFS: StateDef[] = [
  // most common first (higher priority)
  { key: "tired", label: "Втома", group: "low", priority: 100 },
  { key: "anxious", label: "Тривожно", group: "hard", priority: 96 },
  { key: "overwhelmed", label: "Все навалилось", group: "hard", priority: 90 },
  { key: "noisy", label: "Шумно в голові", group: "restless", priority: 88 },
  { key: "sad", label: "Сумно", group: "low", priority: 84 },
  { key: "empty", label: "Порожньо", group: "low", priority: 82 },
  { key: "tense", label: "Напружено", group: "restless", priority: 80 },
  { key: "unmotivated", label: "Немає сил почати", group: "low", priority: 78 },
  { key: "angry", label: "Злюсь", group: "hard", priority: 74 },
  { key: "irritated", label: "Дратує все", group: "hard", priority: 72 },
  { key: "lonely", label: "Самотньо", group: "low", priority: 70 },
  { key: "restless", label: "Не всидіти", group: "restless", priority: 66 },
  { key: "foggy", label: "Туман, не думається", group: "restless", priority: 64 },
  { key: "guilty", label: "Провина", group: "hard", priority: 60 },
  { key: "scattered", label: "Розсіяно", group: "restless", priority: 58 },
  { key: "numb", label: "Заціпеніло", group: "low", priority: 54 },
  { key: "wired", label: "Перезбуджено", group: "restless", priority: 50 },
  { key: "bored", label: "Нудно", group: "low", priority: 46 },
  { key: "insecure", label: "Невпевнено", group: "hard", priority: 44 },
  // neutral / good — lower default priority (less often the reason to open the app)
  { key: "ok", label: "Нормально", group: "ok", priority: 40 },
  { key: "calm", label: "Спокійно", group: "ok", priority: 36 },
  { key: "content", label: "Вдоволено", group: "ok", priority: 30 },
  { key: "hopeful", label: "Є надія", group: "ok", priority: 26 },
  { key: "grateful", label: "Вдячно", group: "ok", priority: 22 },
  { key: "energized", label: "Є запал", group: "ok", priority: 18 },
  { key: "unknown", label: "Не знаю", group: "ok", priority: 6 },
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
