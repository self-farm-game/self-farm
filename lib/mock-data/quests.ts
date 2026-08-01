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
  tier: 1 | 2 | 3; // 1 gentle · 2 stretch · 3 bold
  minLevel: number; // tree level (levelInfo.levelNum) required to unlock
  steps: string[];
}

export const QUESTS: MockQuest[] = [
  // ---- calming / anxiety / noise ----
  {
    id: "window-2min", icon: "🪟", title: "Вікно на 2 хвилини", for: "тривога / шум у голові",
    dur: "2 хв", durationMinutes: 2, xp: 12, category: "Спокій",
    states: ["anxious", "noisy", "overwhelmed", "scattered"],
    tier: 1, minLevel: 1,
    steps: ["Підійди до вікна.", "Знайди очима 3 нерухомі речі.", "Видихни довше, ніж вдихаєш.", "Повернись сюди."],
  },
  {
    id: "breath-4-6", icon: "🌬️", title: "Вдих 4 — видих 6", for: "тривога / напруга",
    dur: "2 хв", durationMinutes: 2, xp: 10, category: "Спокій",
    states: ["anxious", "tense", "wired", "overwhelmed", "restless"],
    tier: 1, minLevel: 1,
    steps: ["Вдихай на 4 рахунки.", "Видихай на 6.", "Зроби так 6 разів.", "Поклади долоню на груди — відчуй, як тихшає."],
  },
  {
    id: "name-5things", icon: "🖐️", title: "5 речей навколо", for: "тривога / туман",
    dur: "2 хв", durationMinutes: 2, xp: 10, category: "Спокій",
    states: ["anxious", "foggy", "scattered", "numb", "overwhelmed"],
    tier: 1, minLevel: 1,
    steps: ["Назви 5 речей, які бачиш.", "4, які чуєш.", "3, яких торкаєшся.", "Ти тут. Зараз."],
  },
  {
    id: "cold-water", icon: "💦", title: "Холодна вода на зап'ястя", for: "перезбудження / злість",
    dur: "1 хв", durationMinutes: 1, xp: 8, category: "Спокій",
    states: ["wired", "angry", "irritated", "anxious"],
    tier: 1, minLevel: 1,
    steps: ["Пусти прохолодну воду.", "Потримай під нею зап'ястя 20 секунд.", "Зроби повільний видих.", "Повернись."],
  },

  // ---- body / tension ----
  {
    id: "shoulders-down", icon: "🪶", title: "Плечі вниз", for: "напруга в тілі",
    dur: "1 хв", durationMinutes: 1, xp: 8, category: "Тіло",
    states: ["tense", "anxious", "irritated"],
    tier: 1, minLevel: 1,
    steps: ["Постав ноги на підлогу.", "Підніми плечі до вух.", "Кинь їх вниз з видихом.", "Повтори тричі."],
  },
  {
    id: "stretch-30", icon: "🧎", title: "Потягнутися 30 секунд", for: "напруга / завмерло тіло",
    dur: "1 хв", durationMinutes: 1, xp: 8, category: "Тіло",
    states: ["tense", "numb", "tired", "restless"],
    tier: 1, minLevel: 1,
    steps: ["Встань.", "Потягнись угору, як зі сну.", "Повільно нахились до підлоги.", "Розкотись назад хребець за хребцем."],
  },
  {
    id: "walk-10", icon: "🚶", title: "10 кроків будь-куди", for: "не всидіти / порожньо",
    dur: "3 хв", durationMinutes: 3, xp: 10, category: "Тіло",
    states: ["restless", "empty", "unmotivated", "foggy", "bored"],
    tier: 1, minLevel: 1,
    steps: ["Встань.", "Пройди 10 кроків у будь-який бік.", "Поглянь у вікно дорогою.", "Повернись сюди."],
  },

  // ---- energy / body basics ----
  {
    id: "water-10steps", icon: "💧", title: "Вода + 10 кроків", for: "втома / порожньо",
    dur: "3 хв", durationMinutes: 3, xp: 10, category: "Тіло",
    states: ["tired", "empty", "foggy", "unmotivated"],
    tier: 1, minLevel: 1,
    steps: ["Налий склянку води.", "Випий повільно.", "Пройди 10 кроків будь-куди.", "Повернись сюди."],
  },
  {
    id: "snack", icon: "🍎", title: "Маленький перекус", for: "втома / туман",
    dur: "3 хв", durationMinutes: 3, xp: 9, category: "Тіло",
    states: ["tired", "foggy", "empty", "numb"],
    tier: 1, minLevel: 1,
    steps: ["Знайди щось просте поїсти.", "З'їж повільно, без екрана.", "Поміть, що тіло трохи ожило.", "Повернись."],
  },
  {
    id: "eyes-rest", icon: "👁️", title: "Очі відпочивають", for: "втома / перевантаження",
    dur: "1 хв", durationMinutes: 1, xp: 8, category: "Відпочинок",
    states: ["tired", "overwhelmed", "foggy", "wired"],
    tier: 1, minLevel: 1,
    steps: ["Заплющ очі.", "Накрий їх теплими долонями.", "Побудь у темряві 30 секунд.", "Повільно розплющ."],
  },

  // ---- low mood / sadness / emptiness ----
  {
    id: "warm-drink", icon: "🍵", title: "Тепле в чашці", for: "сумно / самотньо",
    dur: "4 хв", durationMinutes: 4, xp: 10, category: "Тепло",
    states: ["sad", "lonely", "empty", "numb", "tired"],
    tier: 1, minLevel: 1,
    steps: ["Зроби собі тепле питво.", "Обхопи чашку долонями.", "Зроби перший ковток уважно.", "Побудь із теплом хвилинку."],
  },
  {
    id: "one-kind-line", icon: "💌", title: "Одне добре собі", for: "провина / невпевненість",
    dur: "2 хв", durationMinutes: 2, xp: 9, category: "Тепло",
    states: ["guilty", "insecure", "sad", "lonely"],
    tier: 1, minLevel: 1,
    steps: ["Згадай: сьогодні важко.", "Скажи собі те, що сказав би другові.", "Не мусиш вірити на 100%.", "Досить, що промовив."],
  },
  {
    id: "text-someone", icon: "📩", title: "Коротке «привіт»", for: "самотньо",
    dur: "3 хв", durationMinutes: 3, xp: 10, category: "Тепло",
    states: ["lonely", "sad", "empty"],
    tier: 2, minLevel: 2,
    steps: ["Обери людину, з якою легко.", "Напиши просте «привіт» чи мем.", "Без очікувань відповіді.", "Ти простягнув ниточку — цього досить."],
  },

  // ---- restlessness / anger / irritation ----
  {
    id: "shake-out", icon: "🫨", title: "Струсити з себе", for: "злість / перезбудження",
    dur: "1 хв", durationMinutes: 1, xp: 8, category: "Розрядка",
    states: ["angry", "wired", "restless", "irritated", "tense"],
    tier: 1, minLevel: 1,
    steps: ["Стань зручно.", "Потруси кистями, руками, плечима.", "Додай ноги.", "Зупинись і відчуй, як гуде тіло."],
  },
  {
    id: "tidy-one", icon: "🧹", title: "Прибери одну річ", for: "розсіяно / дратує все",
    dur: "3 хв", durationMinutes: 3, xp: 10, category: "Лад",
    states: ["scattered", "irritated", "overwhelmed", "restless"],
    tier: 1, minLevel: 1,
    steps: ["Обери рівно ОДНУ річ.", "Постав її на місце.", "Не кімнату — одну річ.", "Поглянь на цей маленький острівець ладу."],
  },
  {
    id: "brain-dump", icon: "📝", title: "Вивалити з голови", for: "шумно / все навалилось",
    dur: "3 хв", durationMinutes: 3, xp: 11, category: "Ясність",
    states: ["noisy", "overwhelmed", "scattered", "anxious", "foggy"],
    tier: 1, minLevel: 1,
    steps: ["Візьми аркуш чи нотатки.", "Пиши все, що в голові, без порядку.", "Не редагуй.", "Закрий. Голова трохи вільніша."],
  },

  // ---- maintenance / good-enough states ----
  {
    id: "savor-1min", icon: "☀️", title: "Затримати хороше", for: "спокій / вдоволення",
    dur: "1 хв", durationMinutes: 1, xp: 9, category: "Опора", maintenance: true,
    states: ["ok", "calm", "content", "grateful", "hopeful"],
    tier: 1, minLevel: 1,
    steps: ["Поміть, що зараз непогано.", "Знайди одну приємну деталь навколо.", "Побудь з нею 30 секунд.", "Дай собі це запам'ятати."],
  },
  {
    id: "three-good", icon: "✨", title: "Три дрібнички дня", for: "вдячність / опора",
    dur: "3 хв", durationMinutes: 3, xp: 10, category: "Опора", maintenance: true,
    states: ["grateful", "content", "ok", "calm", "hopeful", "sad"],
    tier: 1, minLevel: 1,
    steps: ["Згадай 3 дрібні хороші речі сьогодні.", "Хай будуть зовсім прості.", "Признач одній з них «дякую».", "Повернись."],
  },
  {
    id: "tiny-step", icon: "🌱", title: "Один крихітний крок", for: "є запал / немає сил почати",
    dur: "3 хв", durationMinutes: 3, xp: 11, category: "Рух", maintenance: true,
    states: ["energized", "hopeful", "unmotivated", "bored", "content"],
    tier: 2, minLevel: 2,
    steps: ["Візьми справу, що лякає обсягом.", "Відколупни від неї 2-хвилинний шматочок.", "Зроби лише його.", "Стоп. Ти зрушив — цього досить."],
  },
  {
    id: "stand-breathe", icon: "🧍", title: "Просто постояти", for: "будь-що / перезавантаження",
    dur: "1 хв", durationMinutes: 1, xp: 7, category: "Опора", maintenance: true,
    states: ["ok", "calm", "numb", "foggy", "tired", "unknown"],
    tier: 1, minLevel: 1,
    steps: ["Встань рівно.", "Відчуй стопи на підлозі.", "Три спокійні вдихи-видихи.", "Все. Ти зробив паузу."],
  },

  // ---- tier 2: gentle stretch (unlock as the tree grows) ----
  {
    id: "call-someone", icon: "📞", title: "Подзвонити, а не написати", for: "самотньо / уникання",
    dur: "6 хв", durationMinutes: 6, xp: 16, category: "Сміливість",
    states: ["lonely", "sad", "anxious", "empty"], tier: 2, minLevel: 3,
    steps: ["Обери людину, дзвінок якій відкладаєш.", "Скажи собі: 3 хвилини — і досить.", "Подзвони й спитай, як справи.", "Хоч трохи — і ти вже вийшов із мушлі."],
  },
  {
    id: "say-no", icon: "✋", title: "Сказати одне «ні»", for: "перевантаження / провина",
    dur: "5 хв", durationMinutes: 5, xp: 16, category: "Опора", tier: 2, minLevel: 3,
    states: ["overwhelmed", "guilty", "tense", "irritated"],
    steps: ["Згадай, куди тебе тягнуть проти волі.", "Сформулюй коротке чесне «ні».", "Скажи або напиши його.", "Побудь із тим, що межа — це нормально."],
  },
  {
    id: "ask-help", icon: "🤲", title: "Попросити про маленьку поміч", for: "все навалилось / самотньо",
    dur: "6 хв", durationMinutes: 6, xp: 17, category: "Сміливість", tier: 2, minLevel: 4,
    states: ["overwhelmed", "lonely", "tired", "sad"],
    steps: ["Обери одну річ, з якою важко самому.", "Знайди, кого можна попросити.", "Попроси прямо й конкретно.", "Прийняти поміч — теж сила."],
  },

  // ---- tier 3: bold (only for a well-grown tree) ----
  {
    id: "talk-stranger", icon: "🗣️", title: "Заговорити з незнайомцем", for: "самотньо / вихід із зони",
    dur: "10 хв", durationMinutes: 10, xp: 24, category: "Сміливість", tier: 3, minLevel: 4,
    states: ["lonely", "anxious", "empty", "bored", "insecure"],
    steps: ["Вийди туди, де є люди (черга, ліфт, кав'ярня).", "Обери когось і скажи щось просте: про погоду, чергу, каву.", "Один рядок — не мусиш вести розмову.", "Що б не сталось — ти зробив сміливу річ. Повернись."],
  },
  {
    id: "solo-outing", icon: "🎟️", title: "Вийти кудись самому", for: "порожньо / застряг удома",
    dur: "10 хв", durationMinutes: 10, xp: 22, category: "Сміливість", tier: 3, minLevel: 5,
    states: ["empty", "sad", "bored", "lonely", "numb"],
    steps: ["Обери місце, куди давно не наважувався піти сам.", "Збери мінімум і вийди.", "Побудь там хоч трохи, без телефона.", "Повернись і поміть, що ти зміг."],
  },
  {
    id: "hard-conversation", icon: "🫂", title: "Одна складна фраза", for: "провина / напруга у стосунках",
    dur: "8 хв", durationMinutes: 8, xp: 22, category: "Сміливість", tier: 3, minLevel: 6,
    states: ["guilty", "tense", "sad", "anxious"],
    steps: ["Згадай розмову, якої уникаєш.", "Сформулюй одну чесну фразу — без звинувачень.", "Скажи або надішли її.", "Ти торкнувся важкого. Цього достатньо на сьогодні."],
  }  ,
  // ---- more calm / anxiety ----
  {
    id: "hum-tune", icon: "🎵", title: "Промугикати мелодію", for: "тривога / напруга",
    dur: "1 хв", durationMinutes: 1, xp: 9, category: "Спокій", tier: 1, minLevel: 1,
    states: ["anxious", "tense", "sad", "wired"],
    steps: ["Обери будь-яку мелодію.", "Тихо промугикай її 30 секунд.", "Відчуй вібрацію в грудях.", "Це заспокоює нерв, що тримає тривогу."],
  },
  {
    id: "feet-floor", icon: "🦶", title: "Стопи на підлозі", for: "паніка / відрив від тіла",
    dur: "1 хв", durationMinutes: 1, xp: 8, category: "Спокій", tier: 1, minLevel: 1,
    states: ["anxious", "numb", "overwhelmed", "foggy"],
    steps: ["Сядь і роззуйся, якщо можна.", "Притисни стопи до підлоги.", "Відчуй кожну точку опори.", "Ти стоїш на землі. Вона тримає."],
  },
  {
    id: "warm-shower", icon: "🚿", title: "Тепла вода на 3 хвилини", for: "перевантаження / заціпеніло",
    dur: "5 хв", durationMinutes: 5, xp: 12, category: "Тіло", tier: 1, minLevel: 1,
    states: ["overwhelmed", "numb", "tense", "tired", "sad"],
    steps: ["Пусти приємно теплу воду.", "Постій під нею, не поспішаючи.", "Відчуй, як тепло розходиться.", "Вийди трохи мʼякшим."],
  },
  // ---- more low mood / motivation ----
  {
    id: "open-window-air", icon: "🌬️", title: "Впустити свіже повітря", for: "туман / застій",
    dur: "2 хв", durationMinutes: 2, xp: 9, category: "Тіло", tier: 1, minLevel: 1,
    states: ["foggy", "tired", "empty", "bored", "numb"],
    steps: ["Відчини вікно навстіж.", "Стань біля нього.", "Зроби 5 глибоких вдихів свіжого повітря.", "Поверни трохи ясності."],
  },
  {
    id: "two-min-task", icon: "✅", title: "Одна 2-хвилинна справа", for: "немає сил почати / провина",
    dur: "3 хв", durationMinutes: 3, xp: 11, category: "Рух", tier: 1, minLevel: 1,
    states: ["unmotivated", "guilty", "overwhelmed", "scattered", "bored"],
    steps: ["Обери справу, що займе ≤2 хв.", "Зроби лише її, до кінця.", "Не берись за наступну.", "Один камінчик зрушено."],
  },
  {
    id: "make-bed", icon: "🛏️", title: "Заправити ліжко", for: "розсіяно / важкий ранок",
    dur: "3 хв", durationMinutes: 3, xp: 9, category: "Лад", tier: 1, minLevel: 1,
    states: ["scattered", "unmotivated", "empty", "sad"],
    steps: ["Підійди до ліжка.", "Розрівняй і заправ його.", "Поглянь на результат.", "День почався з одного зробленого."],
  },
  {
    id: "sunlight", icon: "☀️", title: "2 хвилини на світлі", for: "туман / пригнічено",
    dur: "3 хв", durationMinutes: 3, xp: 10, category: "Тіло", tier: 1, minLevel: 1,
    states: ["foggy", "sad", "tired", "empty", "numb"],
    steps: ["Знайди найсвітліше місце (вікно/двір).", "Постій на світлі 2 хвилини.", "Підстав обличчя.", "Світло трохи будить."],
  },
  // ---- more restless / anger ----
  {
    id: "pushups", icon: "💪", title: "10 присідань чи віджимань", for: "перезбудження / злість",
    dur: "2 хв", durationMinutes: 2, xp: 11, category: "Розрядка", tier: 1, minLevel: 1,
    states: ["wired", "angry", "restless", "irritated", "tense"],
    steps: ["Зроби 10 присідань (або віджимань).", "Швидко, до легкого видиху.", "Струсни руки.", "Енергія знайшла вихід."],
  },
  {
    id: "rip-paper", icon: "📄", title: "Порвати аркуш", for: "злість / роздратування",
    dur: "1 хв", durationMinutes: 1, xp: 8, category: "Розрядка", tier: 1, minLevel: 1,
    states: ["angry", "irritated", "tense", "wired"],
    steps: ["Візьми непотрібний аркуш.", "Порви його на дрібні шматки.", "Відчуй, як напруга виходить у рух.", "Викинь. Досить."],
  },
  {
    id: "cold-air", icon: "🧊", title: "Вийти на прохолоду", for: "перегрів емоцій",
    dur: "3 хв", durationMinutes: 3, xp: 9, category: "Розрядка", tier: 1, minLevel: 1,
    states: ["angry", "wired", "overwhelmed", "irritated"],
    steps: ["Вийди на балкон/подвір'я/до вікна.", "Вдихни прохолодне повітря.", "Порахуй до 10 повільно.", "Повернись трохи охолодженим."],
  },
  // ---- more warmth / loneliness ----
  {
    id: "pet-plant", icon: "🪴", title: "Догляд за рослиною/твариною", for: "самотньо / порожньо",
    dur: "3 хв", durationMinutes: 3, xp: 10, category: "Тепло", tier: 1, minLevel: 1,
    states: ["lonely", "empty", "sad", "numb"],
    steps: ["Підійди до рослини чи улюбленця.", "Полий / погладь / приділи увагу.", "Побудь у цій турботі хвилинку.", "Турбота про когось гріє й тебе."],
  },
  {
    id: "photo-memory", icon: "📷", title: "Одне тепле фото", for: "сумно / самотньо",
    dur: "2 хв", durationMinutes: 2, xp: 9, category: "Тепло", tier: 1, minLevel: 1,
    states: ["sad", "lonely", "empty", "numb"],
    steps: ["Відкрий галерею.", "Знайди фото, що гріє.", "Побудь із ним 30 секунд.", "Згадай, що хороше було й буде."],
  },
  // ---- more maintenance / good ----
  {
    id: "plan-nice", icon: "🗓️", title: "Запланувати дрібну радість", for: "спокій / надія",
    dur: "3 хв", durationMinutes: 3, xp: 10, category: "Опора", tier: 1, minLevel: 1, maintenance: true,
    states: ["ok", "calm", "content", "hopeful", "bored"],
    steps: ["Придумай дрібну приємність на потім.", "Признач їй час.", "Запиши чи постав нагадування.", "Тепер є на що чекати."],
  },
  {
    id: "stretch-reach", icon: "🙆", title: "Потягнутися до неба", for: "запал / бадьорість",
    dur: "1 хв", durationMinutes: 1, xp: 8, category: "Опора", tier: 1, minLevel: 1, maintenance: true,
    states: ["energized", "ok", "calm", "content", "restless"],
    steps: ["Встань, підніми руки вгору.", "Тягнись, наче хочеш торкнутись стелі.", "Зроби глибокий вдих.", "Відпусти з видихом."],
  },
  // ---- tier 2 extra ----
  {
    id: "compliment", icon: "💬", title: "Сказати комусь щось приємне", for: "самотньо / замкнено",
    dur: "4 хв", durationMinutes: 4, xp: 15, category: "Сміливість", tier: 2, minLevel: 3,
    states: ["lonely", "sad", "insecure", "empty"],
    steps: ["Обери людину поруч чи в мережі.", "Скажи їй одну щиру приємну річ.", "Без очікувань у відповідь.", "Тепло, віддане назовні, вертається."],
  },
  {
    id: "walk-outside", icon: "🌳", title: "Коротка прогулянка надвір", for: "туман / застряг",
    dur: "10 хв", durationMinutes: 10, xp: 16, category: "Тіло", tier: 2, minLevel: 2,
    states: ["foggy", "empty", "restless", "sad", "unmotivated", "anxious"],
    steps: ["Вдягнись і вийди за поріг.", "Пройдись 5-7 хвилин без мети.", "Дивись навколо, не в телефон.", "Повернись трохи іншим."],
  },
  // ---- tier 3 extra ----
  {
    id: "join-activity", icon: "🎯", title: "Долучитись до чогось із людьми", for: "самотньо / застій",
    dur: "15 хв", durationMinutes: 15, xp: 24, category: "Сміливість", tier: 3, minLevel: 5,
    states: ["lonely", "empty", "bored", "sad", "insecure"],
    steps: ["Знайди подію/групу/гурток поблизу чи онлайн.", "Долучись хоч ненадовго.", "Не мусиш бути зіркою — просто бути там.", "Ти вийшов до людей. Це велике."],
  }
];

// Pick up to `n` quests that fit the chosen states AND the tree's level.
// As the tree grows (higher level) harder tiers unlock and are gently favoured,
// so the challenge rises with progress — but a fitting gentle quest is always
// kept in the mix so nothing ever feels forced.
export function suggestQuests(stateKeys: string[], level = 1, n = 3): MockQuest[] {
  const picked = stateKeys.filter((k) => k !== "unknown");

  // only quests the tree has grown into
  const unlocked = QUESTS.filter((q) => q.minLevel <= level);

  const scored = unlocked.map((q) => {
    const hits = q.states.filter((s) => picked.includes(s)).length;
    // small nudge toward the hardest tier currently unlocked, so growth shows
    const tierBonus = hits > 0 ? q.tier * 0.1 : 0;
    return { q, hits, score: hits + tierBonus };
  });

  // small deterministic-ish jitter so equally-fitting quests rotate between
  // check-ins instead of always showing the same three
  const jitter = () => Math.random() * 0.35;
  let matches = scored
    .filter((s) => s.hits > 0)
    .map((s) => ({ ...s, score: s.score + jitter() }))
    .sort((a, b) => b.score - a.score);

  // nothing chosen / no direct match → gentle universal maintenance quests
  if (matches.length === 0) {
    matches = scored
      .filter((s) => s.q.maintenance)
      .map((s) => ({ ...s, hits: 0, score: 0 }));
  }

  const out: MockQuest[] = matches.slice(0, n).map((s) => s.q);

  // guarantee at least one gentle (tier 1) option is present
  if (out.length && !out.some((q) => q.tier === 1)) {
    const gentle = matches.find((m) => m.q.tier === 1);
    if (gentle) {
      out.pop();
      out.unshift(gentle.q);
    }
  }

  // top up with maintenance quests if short
  if (out.length < n) {
    for (const q of unlocked) {
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
