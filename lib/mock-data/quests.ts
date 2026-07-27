// Quest library. Each quest is tagged with the states it helps with, so that
// after a check-in we can suggest the ones that fit how the person feels.
// Quests aim to gently improve OR hold the current state — never "fix" the day.

export interface MockQuest {
  id: string;
  icon: string;
  title: string;
  for: string; // human-readable target states (shown on the card)
  dur: string; // "2 хв"
  durationMinutes: number;
  xp: number;
  category: string;
  states: string[]; // state keys this quest suits (see lib/mock-data/states.ts)
  maintenance?: boolean; // true = good for holding a decent state, not only for hard ones
  steps: string[];
}

export const QUESTS: MockQuest[] = [
  // ---- calming / anxiety / noise ----
  {
    id: "window-2min", icon: "🪟", title: "Вікно на 2 хвилини", for: "тривога / шум у голові",
    dur: "2 хв", durationMinutes: 2, xp: 12, category: "Спокій",
    states: ["anxious", "noisy", "overwhelmed", "scattered"],
    steps: ["Підійди до вікна.", "Знайди очима 3 нерухомі речі.", "Видихни довше, ніж вдихаєш.", "Повернись сюди."],
  },
  {
    id: "breath-4-6", icon: "🌬️", title: "Вдих 4 — видих 6", for: "тривога / напруга",
    dur: "2 хв", durationMinutes: 2, xp: 10, category: "Спокій",
    states: ["anxious", "tense", "wired", "overwhelmed", "restless"],
    steps: ["Вдихай на 4 рахунки.", "Видихай на 6.", "Зроби так 6 разів.", "Поклади долоню на груди — відчуй, як тихшає."],
  },
  {
    id: "name-5things", icon: "🖐️", title: "5 речей навколо", for: "тривога / туман",
    dur: "2 хв", durationMinutes: 2, xp: 10, category: "Спокій",
    states: ["anxious", "foggy", "scattered", "numb", "overwhelmed"],
    steps: ["Назви 5 речей, які бачиш.", "4, які чуєш.", "3, яких торкаєшся.", "Ти тут. Зараз."],
  },
  {
    id: "cold-water", icon: "💦", title: "Холодна вода на зап'ястя", for: "перезбудження / злість",
    dur: "1 хв", durationMinutes: 1, xp: 8, category: "Спокій",
    states: ["wired", "angry", "irritated", "anxious"],
    steps: ["Пусти прохолодну воду.", "Потримай під нею зап'ястя 20 секунд.", "Зроби повільний видих.", "Повернись."],
  },

  // ---- body / tension ----
  {
    id: "shoulders-down", icon: "🪶", title: "Плечі вниз", for: "напруга в тілі",
    dur: "1 хв", durationMinutes: 1, xp: 8, category: "Тіло",
    states: ["tense", "anxious", "irritated"],
    steps: ["Постав ноги на підлогу.", "Підніми плечі до вух.", "Кинь їх вниз з видихом.", "Повтори тричі."],
  },
  {
    id: "stretch-30", icon: "🧎", title: "Потягнутися 30 секунд", for: "напруга / завмерло тіло",
    dur: "1 хв", durationMinutes: 1, xp: 8, category: "Тіло",
    states: ["tense", "numb", "tired", "restless"],
    steps: ["Встань.", "Потягнись угору, як зі сну.", "Повільно нахились до підлоги.", "Розкотись назад хребець за хребцем."],
  },
  {
    id: "walk-10", icon: "🚶", title: "10 кроків будь-куди", for: "не всидіти / порожньо",
    dur: "3 хв", durationMinutes: 3, xp: 10, category: "Тіло",
    states: ["restless", "empty", "unmotivated", "foggy", "bored"],
    steps: ["Встань.", "Пройди 10 кроків у будь-який бік.", "Поглянь у вікно дорогою.", "Повернись сюди."],
  },

  // ---- energy / body basics ----
  {
    id: "water-10steps", icon: "💧", title: "Вода + 10 кроків", for: "втома / порожньо",
    dur: "3 хв", durationMinutes: 3, xp: 10, category: "Тіло",
    states: ["tired", "empty", "foggy", "unmotivated"],
    steps: ["Налий склянку води.", "Випий повільно.", "Пройди 10 кроків будь-куди.", "Повернись сюди."],
  },
  {
    id: "snack", icon: "🍎", title: "Маленький перекус", for: "втома / туман",
    dur: "3 хв", durationMinutes: 3, xp: 9, category: "Тіло",
    states: ["tired", "foggy", "empty", "numb"],
    steps: ["Знайди щось просте поїсти.", "З'їж повільно, без екрана.", "Поміть, що тіло трохи ожило.", "Повернись."],
  },
  {
    id: "eyes-rest", icon: "👁️", title: "Очі відпочивають", for: "втома / перевантаження",
    dur: "1 хв", durationMinutes: 1, xp: 8, category: "Відпочинок",
    states: ["tired", "overwhelmed", "foggy", "wired"],
    steps: ["Заплющ очі.", "Накрий їх теплими долонями.", "Побудь у темряві 30 секунд.", "Повільно розплющ."],
  },

  // ---- low mood / sadness / emptiness ----
  {
    id: "warm-drink", icon: "🍵", title: "Тепле в чашці", for: "сумно / самотньо",
    dur: "4 хв", durationMinutes: 4, xp: 10, category: "Тепло",
    states: ["sad", "lonely", "empty", "numb", "tired"],
    steps: ["Зроби собі тепле питво.", "Обхопи чашку долонями.", "Зроби перший ковток уважно.", "Побудь із теплом хвилинку."],
  },
  {
    id: "one-kind-line", icon: "💌", title: "Одне добре собі", for: "провина / невпевненість",
    dur: "2 хв", durationMinutes: 2, xp: 9, category: "Тепло",
    states: ["guilty", "insecure", "sad", "lonely"],
    steps: ["Згадай: сьогодні важко.", "Скажи собі те, що сказав би другові.", "Не мусиш вірити на 100%.", "Досить, що промовив."],
  },
  {
    id: "text-someone", icon: "📩", title: "Коротке «привіт»", for: "самотньо",
    dur: "3 хв", durationMinutes: 3, xp: 10, category: "Тепло",
    states: ["lonely", "sad", "empty"],
    steps: ["Обери людину, з якою легко.", "Напиши просте «привіт» чи мем.", "Без очікувань відповіді.", "Ти простягнув ниточку — цього досить."],
  },

  // ---- restlessness / anger / irritation ----
  {
    id: "shake-out", icon: "🫨", title: "Струсити з себе", for: "злість / перезбудження",
    dur: "1 хв", durationMinutes: 1, xp: 8, category: "Розрядка",
    states: ["angry", "wired", "restless", "irritated", "tense"],
    steps: ["Стань зручно.", "Потруси кистями, руками, плечима.", "Додай ноги.", "Зупинись і відчуй, як гуде тіло."],
  },
  {
    id: "tidy-one", icon: "🧹", title: "Прибери одну річ", for: "розсіяно / дратує все",
    dur: "3 хв", durationMinutes: 3, xp: 10, category: "Лад",
    states: ["scattered", "irritated", "overwhelmed", "restless"],
    steps: ["Обери рівно ОДНУ річ.", "Постав її на місце.", "Не кімнату — одну річ.", "Поглянь на цей маленький острівець ладу."],
  },
  {
    id: "brain-dump", icon: "📝", title: "Вивалити з голови", for: "шумно / все навалилось",
    dur: "3 хв", durationMinutes: 3, xp: 11, category: "Ясність",
    states: ["noisy", "overwhelmed", "scattered", "anxious", "foggy"],
    steps: ["Візьми аркуш чи нотатки.", "Пиши все, що в голові, без порядку.", "Не редагуй.", "Закрий. Голова трохи вільніша."],
  },

  // ---- maintenance / good-enough states ----
  {
    id: "savor-1min", icon: "☀️", title: "Затримати хороше", for: "спокій / вдоволення",
    dur: "1 хв", durationMinutes: 1, xp: 9, category: "Опора", maintenance: true,
    states: ["ok", "calm", "content", "grateful", "hopeful"],
    steps: ["Поміть, що зараз непогано.", "Знайди одну приємну деталь навколо.", "Побудь з нею 30 секунд.", "Дай собі це запам'ятати."],
  },
  {
    id: "three-good", icon: "✨", title: "Три дрібнички дня", for: "вдячність / опора",
    dur: "3 хв", durationMinutes: 3, xp: 10, category: "Опора", maintenance: true,
    states: ["grateful", "content", "ok", "calm", "hopeful", "sad"],
    steps: ["Згадай 3 дрібні хороші речі сьогодні.", "Хай будуть зовсім прості.", "Признач одній з них «дякую».", "Повернись."],
  },
  {
    id: "tiny-step", icon: "🌱", title: "Один крихітний крок", for: "є запал / немає сил почати",
    dur: "3 хв", durationMinutes: 3, xp: 11, category: "Рух", maintenance: true,
    states: ["energized", "hopeful", "unmotivated", "bored", "content"],
    steps: ["Візьми справу, що лякає обсягом.", "Відколупни від неї 2-хвилинний шматочок.", "Зроби лише його.", "Стоп. Ти зрушив — цього досить."],
  },
  {
    id: "stand-breathe", icon: "🧍", title: "Просто постояти", for: "будь-що / перезавантаження",
    dur: "1 хв", durationMinutes: 1, xp: 7, category: "Опора", maintenance: true,
    states: ["ok", "calm", "numb", "foggy", "tired", "unknown"],
    steps: ["Встань рівно.", "Відчуй стопи на підлозі.", "Три спокійні вдихи-видихи.", "Все. Ти зробив паузу."],
  },
];

// The single starter quest shown on a brand-new garden before any check-in.
export const STARTER_QUEST_ID = "stand-breathe";

// Pick up to `n` quests that fit the chosen states. Falls back sensibly so the
// list is never empty. Maintenance quests are preferred when the person feels ok.
export function suggestQuests(stateKeys: string[], n = 3): MockQuest[] {
  const picked = stateKeys.filter((k) => k !== "unknown");
  const scored = QUESTS.map((q) => {
    const hits = q.states.filter((s) => picked.includes(s)).length;
    return { q, hits };
  });

  let matches = scored.filter((s) => s.hits > 0).sort((a, b) => b.hits - a.hits);

  // nothing chosen / no direct match → gentle, universal maintenance quests
  if (matches.length === 0) {
    matches = scored
      .filter((s) => s.q.maintenance)
      .map((s) => ({ ...s, hits: 0 }));
  }

  const out = matches.slice(0, n).map((s) => s.q);
  // top up to n with maintenance quests if we came up short
  if (out.length < n) {
    for (const q of QUESTS) {
      if (out.length >= n) break;
      if (q.maintenance && !out.includes(q)) out.push(q);
    }
  }
  return out.slice(0, n);
}

// ---- Questbook (browsable catalog) ----------------------------------------
// Derived from the library above so the book always reflects real quests, plus
// a few "locked" teasers to hint at what unlocks with the tree's growth.

export const QUESTBOOK_CATEGORIES = [
  "Усі",
  "Спокій",
  "Тіло",
  "Тепло",
  "Розрядка",
  "Ясність",
  "Опора",
];

export interface QuestbookItem {
  icon: string;
  title: string;
  for?: string;
  meta: string;
  category: string;
  locked?: boolean;
}

export const QUESTBOOK: QuestbookItem[] = [
  ...QUESTS.map((q) => ({
    icon: q.icon,
    title: q.title,
    for: q.for,
    meta: `⏱ ${q.dur} · ✦ +${q.xp}`,
    category: q.category,
  })),
  { icon: "🌙", title: "Вечірнє сповільнення", meta: "відкриється на Саджанці", category: "Опора", locked: true },
  { icon: "🔥", title: "Розрядити злість безпечно", meta: "відкриється на Молодому дубі", category: "Розрядка", locked: true },
  { icon: "🧭", title: "Ранковий маленький намір", meta: "відкриється на Дубі", category: "Опора", locked: true },
];
