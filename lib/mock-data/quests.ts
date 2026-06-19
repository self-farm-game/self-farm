// Mock quests. Structure mirrors lib/types Quest; will move to Supabase later.

export interface MockQuest {
  id: string;
  icon: string;
  title: string;
  for: string; // human-readable target states
  dur: string; // "2 хв"
  durationMinutes: number;
  xp: number;
  steps: string[];
  category: string;
}

// Quests offered as suggestions after a check-in (1–3 matched by state).
export const QUESTS: MockQuest[] = [
  {
    id: "window-2min",
    icon: "🪟",
    title: "Вікно на 2 хвилини",
    for: "шумно / тривожно",
    dur: "2 хв",
    durationMinutes: 2,
    xp: 12,
    category: "Шум",
    steps: [
      "Підійди до вікна.",
      "Знайди очима 3 нерухомі речі.",
      "Видихни довше, ніж вдихаєш.",
      "Повернись сюди.",
    ],
  },
  {
    id: "water-10steps",
    icon: "💧",
    title: "Вода + 10 кроків",
    for: "втома / порожньо",
    dur: "3 хв",
    durationMinutes: 3,
    xp: 10,
    category: "Тіло",
    steps: [
      "Налий склянку води.",
      "Випий повільно.",
      "Пройди 10 кроків будь-куди.",
      "Повернись сюди.",
    ],
  },
  {
    id: "shoulders-down",
    icon: "🪶",
    title: "Плечі вниз",
    for: "напружено",
    dur: "1 хв",
    durationMinutes: 1,
    xp: 8,
    category: "Тіло",
    steps: [
      "Постав ноги на підлогу.",
      "Підніми плечі до вух.",
      "Кинь їх вниз з видихом.",
      "Повтори тричі.",
    ],
  },
];

export const QUESTBOOK_CATEGORIES = [
  "Усі",
  "Шум",
  "Тіло",
  "Відпочинок",
  "Вогонь",
  "Болото",
  "Збірка",
];

export interface QuestbookItem {
  icon: string;
  title: string;
  for: string;
  meta: string;
  locked: boolean;
}

export const QUESTBOOK: QuestbookItem[] = [
  { icon: "🪟", title: "Вікно на 2 хвилини", for: "шумно, тривожно", meta: "2 хв · +12 XP", locked: false },
  { icon: "💧", title: "Вода + 10 кроків", for: "втома, порожньо", meta: "3 хв · +10 XP", locked: false },
  { icon: "🪶", title: "Плечі вниз", for: "напружено", meta: "1 хв · +8 XP", locked: false },
  { icon: "🧹", title: "Прибери один предмет", for: "болото, порожньо", meta: "3 хв · +10 XP", locked: false },
  { icon: "🔒", title: "Дихання 4-7-8", for: "", meta: "Відкриється з Руною Повітря", locked: true },
  { icon: "🔒", title: "Вийти з баклажанного поля", for: "", meta: "Відкриється з Руною Болота", locked: true },
];
