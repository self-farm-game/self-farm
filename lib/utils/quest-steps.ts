// Чого саме крок просить від людини.
//
// Половина кроків каже «запиши» або «постав таймер», а гра давала під це
// саму лише кнопку «Зробив». Тобто просила відкрити нотатки в телефоні,
// вийшовши з гри — рівно те, від чого гра мала б відволікти.
//
// Тип кроку рахується з українського тексту один раз при завантаженні
// модуля й зберігається за індексом. Англійські кроки беруть той самий
// тип за тим самим індексом — вони перекладені один в один, тож нічого
// не розʼїдеться, і патерни треба тримати лише одні.

import { QUESTS } from "@/lib/mock-data/quests-v2";

export type StepKind = {
  /** крок просить щось написати — даємо поле (необовʼязкове) */
  write: boolean;
  /** крок просить відміряти час — даємо відлік; null, якщо тривалості немає */
  timerSec: number | null;
};

// Увага на межі слів: у JS \b рахує словом лише [A-Za-z0-9_], тож поряд
// з кирилицею вона не спрацьовує взагалі — \bпиши\b не збігається ніколи.
// Тому межу праворуч ставимо явним заглядом уперед.
const CYR_END = "(?![а-яіїєґʼ'a-z])";
const WRITE = new RegExp(
  [
    "запиш", "випиш", "напиш", "допиш", "виписуй", "сформулюй", "опиши", "познач",
    "пиши" + CYR_END,
    "мітку", "аркуш", "нотатк", "на папер", "склади список", "у рядок",
    // англійські кроки — той самий сенс
    "write", "jot", "note it", "list ", "describe", "mark ",
  ].join("|"),
  "i",
);

/**
 * Тривалість із тексту кроку.
 *
 * Свідомо вимагаємо цифру: «постій секунду» й «побудь хвилинку» — це
 * мовний зворот, а не завдання на час, і таймер там був би безглуздий.
 * З діапазону беремо менше число: нижня межа — це обіцянка, яку людина
 * точно витримає, а продовжити завжди можна.
 */
function parseDuration(text: string): number | null {
  const m = new RegExp(
    "(\\d+)\\s*(?:[–—-]\\s*\\d+\\s*)?" +
      "(хвилин[а-яіїєґ]*|хв" + CYR_END + "|секунд[а-яіїєґ]*|сек" + CYR_END +
      "|minutes?(?![a-z])|min(?![a-z])|seconds?(?![a-z])|sec(?![a-z]))",
    "i",
  ).exec(text);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n) || n <= 0 || n > 60) return null;
  const unit = m[2].toLowerCase();
  const isSec = /^(секунд|сек|sec|second)/.test(unit);
  const sec = isSec ? n : n * 60;
  // понад 15 хв відлік у грі недоречний — це вже не пауза, а заняття
  return sec > 15 * 60 ? null : sec;
}

function classify(text: string): StepKind {
  return { write: WRITE.test(text), timerSec: parseDuration(text) };
}

const TABLE: Record<string, StepKind[]> = {};
for (const q of QUESTS) TABLE[q.id] = q.steps.map(classify);

const PLAIN: StepKind = { write: false, timerSec: null };

export function stepKind(questId: string, index: number): StepKind {
  return TABLE[questId]?.[index] ?? PLAIN;
}

/** Скільки кроків цієї стежки щось просять — для підказки на картці. */
export function stepTools(questId: string): { write: number; timer: number } {
  const list = TABLE[questId] || [];
  return {
    write: list.filter((k) => k.write).length,
    timer: list.filter((k) => k.timerSec !== null).length,
  };
}

/** "3:05" із секунд. */
export function mmss(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
