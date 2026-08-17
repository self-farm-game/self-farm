// Two languages.
//   en — the neutral, "default" voice. Gentle, encouraging, clean.
//   uk — a fully worked-out Ukrainian voice for Бомбом that is deliberately
//        blunt and unfiltered (mild profanity). This is a stylistic choice:
//        the sharper, funnier tone is what makes the Ukrainian build feel alive.
//
// Only Бомбом's *voice* changes drastically. UI labels are simply translated.

export type Lang = "uk" | "en";

// ---- Бомбом's lines -------------------------------------------------------
export const BOMBOM_LINES: Record<Lang, string[]> = {
  en: [
    "The tree grows slowly. It's in no rush — that's exactly why it makes it.",
    "You're not late. You just moved at your own pace. Like a snail. Snails arrive too.",
    "A whole forest is just a pile of trees that didn't give up. Start with one.",
    "Sometimes the bravest thing is to drink some water and go to sleep.",
    "The stone in your pocket used to be a mountain. No rush to become one again.",
    "You can't plant a forest in one evening. But one tree — sure. It all starts there.",
    "Even a tiny step still points forward. That counts.",
    "You showed up. That's already more than nothing.",
  ],
  uk: [
    "Дерево росте повільно, і йому насрати на твій дедлайн. Росте — та й добре.",
    "Ти не запізнився. Ти йшов, як равлик. Але равлик, курва, теж доходить.",
    "Зробив трохи? Це вже трохи краще за ніхуя. А «краще за ніхуя» — це прогрес, хоч і крихітний.",
    "Іноді найхоробріше, що можна зробити, — це напитися води й лягти спати. Без геройства.",
    "Камінь у кишені колись був горою. Не гони знову ставати горою, посидь каменем.",
    "Ліс за вечір не насадиш, хоч ти лусни. Але одне сране дерево — цілком. З нього все й починається.",
    "Ти встав з ліжка. У цьому світі це вже, блін, досягнення. Запиши собі плюсик.",
    "Нема сил? То й хер з ним. Посидь. Дерево не втече, і я нікуди не дінусь.",
    "Не мусиш бути в порядку. Мусиш просто бути. Оце й усе завдання на сьогодні.",
    "Зробив маленьку хуйню з користю — вже молодець. Велику потім, як захочеш.",
  ],
};

// ---- UI strings (translated, no attitude) --------------------------------
type Dict = Record<string, string>;
const STRINGS: Record<Lang, Dict> = {
  en: {
    "cta.how_are_you": "✦  How are you?",
    "cta.paths_waiting": "Paths are waiting 🌿",
    "cta.finish_set": "Clear the set in “Quests” ({n}) — then a new check-in opens.",
    "hint.first": "start with one state — 3 paths open under it",
    "hint.again": "log a state — 3 paths open under it",
    "hint.xp_left": "XP left: {n}/{cap}",
    "hint.xp_done": "window XP limit reached — quests still work, just no XP",
    "tab.garden": "Garden",
    "tab.quests": "Quests",
    "tab.journal": "Journal",
    "tab.runes": "Runes",
    "tab.cabin": "Cabin",
    "cabin.language": "Language",
    "cabin.language_val": "English",
    "hollow.title": "🕳️ Tree hollow",
    "hollow.desc": "You can tuck one rune in here — a quiet charm in the trunk.",
    "hollow.empty": "No runes yet. They sprout from returning and quests.",
    "hollow.remove": "take the rune out of the hollow",
    "hollow.close": "close",
  },
  uk: {
    "cta.how_are_you": "✦  Як ти зараз?",
    "cta.paths_waiting": "Стежки чекають 🌿",
    "cta.finish_set": "Пройди набір у «Квестах» ({n}) — тоді відкриється новий чек-ін.",
    "hint.first": "почни з одного стану — під нього відкриються 3 стежки",
    "hint.again": "введи настрій — відкриються 3 стежки під нього",
    "hint.xp_left": "XP лишилось: {n}/{cap}",
    "hint.xp_done": "XP-ліміт вікна вичерпано — квести ще діють, але без XP",
    "tab.garden": "Сад",
    "tab.quests": "Квести",
    "tab.journal": "Журнал",
    "tab.runes": "Руни",
    "tab.cabin": "Хатина",
    "cabin.language": "Мова",
    "cabin.language_val": "Українська",
    "hollow.title": "🕳️ Дупло дерева",
    "hollow.desc": "Сюди можна сховати одну руну — тихий оберіг у стовбурі.",
    "hollow.empty": "Поки нема жодної руни. Вони проростають від повернень і квестів.",
    "hollow.remove": "прибрати руну з дупла",
    "hollow.close": "закрити",
  },
};

export function t(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  let str = STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) str = str.replaceAll(`{${k}}`, String(v));
  return str;
}
