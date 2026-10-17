// Static copy and option sets, taken verbatim from the Self-Farm design.

export const STATES = [
  "Тривожно",
  "Шумно",
  "Злюсь",
  "Порожньо",
  "Втома",
  "Напружено",
  "Сумно",
  "Нормально",
  "Спокійно",
  "Не знаю",
];

export const ENERGY = ["нема", "мало", "норм", "багато", "несе"];
export const TENSION = ["нема", "трохи", "сильно"];
export const BODY = ["голова", "груди", "живіт", "плечі", "руки", "не знаю"];

export interface AfterOption {
  label: string;
  icon: string;
  good?: boolean;
}
export const AFTER: AfterOption[] = [
  { label: "Стало легше", icon: "🌤️", good: true },
  { label: "Так само", icon: "🪨" },
  { label: "Стало важче", icon: "🌧️" },
  { label: "Не знаю", icon: "🌫️" },
];

export interface OnboardingStep {
  icon: string;
  bg: string;
  kicker: string;
  title: string;
  sub: string | null;
  btn: string;
  kickerEn: string;
  titleEn: string;
  subEn: string | null;
  btnEn: string;
}
export const ONBOARDING: OnboardingStep[] = [
  {
    icon: "cave",
    bg: "linear-gradient(180deg,#1a1226,#2a1d3e)",
    kicker: "крок 1",
    title: "Ти вийшов із печери блиску.",
    sub: "Стрічки, дзижчання, миготіння. Шум ще в голові.",
    btn: "Далі",
    kickerEn: "step 1",
    titleEn: "You walked out of the cave of glitter.",
    subEn: "Feeds, buzzing, flickering. The noise is still in your head.",
    btnEn: "Next",
  },
  {
    icon: "fog",
    bg: "linear-gradient(180deg,#2a2435,#3a3142)",
    kicker: "крок 2",
    title: "Зовні — не ліс. Просто пусте поле.",
    sub: "Тиша спершу лякає. У ній стає видно власний стан.",
    btn: "Далі",
    kickerEn: "step 2",
    titleEn: "Outside there's no forest. Just an empty field.",
    subEn: "The quiet is frightening at first. In it you can see your own state.",
    btnEn: "Next",
  },
  {
    icon: "gnome",
    bg: "linear-gradient(180deg,#241a42,#2b1f4d)",
    kicker: "тебе зустрічає бомбом",
    title: "«Ліс садити не будемо. Одне дерево. Один рух.»",
    sub: null,
    btn: "🌱  Посадити дерево",
    kickerEn: "bombom comes to meet you",
    titleEn: "\u201cWe're not planting a forest. One tree. One move.\u201d",
    subEn: null,
    btnEn: "\ud83c\udf31  Plant the tree",
  },
];

// Бомбом one-liners (funny + a little philosophical)
export const BOMBOM_LINES = [
  "Дерево росте повільно. Воно нікуди не спішить — і саме тому доростає.",
  "Ти не запізнився. Просто йшов своїм темпом. Як равлик. Але равлик теж доходить.",
  "Великий ліс — це купа дерев, які просто не здалися. Почни з одного.",
  "Інколи найхоробріше, що можна зробити — це полити себе водою і лягти спати.",
  "Камінь у кишені теж колись був горою. Не поспішай ставати горою назад.",
  "Не можна засадити цілий ліс за вечір. Але одне дерево — цілком. З нього все й починається.",
];

export const CABIN_ROWS = [
  { icon: "🌐", label: "Мова", val: "Українська" },
  { icon: "🔔", label: "Нагадування", val: "м'які" },
  { icon: "📤", label: "Експорт даних", val: "" },
  { icon: "🌱", label: "Про Self-Farm", val: "" },
];

// `key` points into the dictionary (lib/mock-data/i18n.ts); `label` is the
// Ukrainian fallback for anything that renders NAV without a language.
export const NAV = [
  { id: "garden", icon: "tree", key: "tab.garden", label: "Сад", href: "/garden" },
  { id: "questbook", icon: "scroll", key: "tab.quests", label: "Квести", href: "/questbook" },
  { id: "journal", icon: "book", key: "tab.journal", label: "Журнал", href: "/journal" },
  { id: "runes", icon: "rune", key: "tab.runes", label: "Руни", href: "/runes" },
  { id: "cabin", icon: "hut", key: "tab.cabin", label: "Хатина", href: "/cabin" },
];

export const JOURNAL_FILTERS = ["Усе", "Стани", "Квести", "Нотатки", "Знахідки"];

// Seed journal so the timeline is not empty on first run.
export interface JournalEntry {
  time: string;
  state: string;
  energy: string;
  tension: string | null;
  quest: string | null;
  after: string | null;
  reward: string | null;
  note: string | null;
}
export interface JournalDay {
  day: string;
  entries: JournalEntry[];
}
export const JOURNAL_SEED: JournalDay[] = [
  {
    day: "Учора",
    entries: [
      {
        time: "22:30",
        state: "Порожньо",
        energy: "нема",
        tension: "трохи",
        quest: "Вода + 10 кроків",
        after: "так само",
        reward: "+10 XP",
        note: null,
      },
    ],
  },
];
