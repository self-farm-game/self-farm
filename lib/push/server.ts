// Серверна частина push: доступ до бази й перевірка, кому саме зараз час.
//
// Усе, що тут є, працює лише на сервері — тут service-role ключ, якому
// RLS не писаний. У браузер цей файл не потрапляє (його імпортують лише
// route-хендлери з runtime = "nodejs").

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type PushSub = {
  endpoint: string;
  p256dh: string;
  auth: string;
  times: string[];
  tz: string;
  lang: string;
  last_sent: string | null;
};

export const pushConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY,
);

/** Клієнт із service-role ключем. Тільки для серверних маршрутів. */
export function adminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** "20:00" → 1200. Некоректний рядок → null. */
export function parseHHMM(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec((s || "").trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (h < 0 || h > 23 || mi < 0 || mi > 59) return null;
  return h * 60 + mi;
}

/** Котра зараз година в цьому часовому поясі, у хвилинах від півночі. */
export function localMinutes(now: Date, tz: string): number | null {
  try {
    const p = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(now);
    const h = Number(p.find((x) => x.type === "hour")?.value);
    const mi = Number(p.find((x) => x.type === "minute")?.value);
    if (Number.isNaN(h) || Number.isNaN(mi)) return null;
    return (h % 24) * 60 + mi;
  } catch {
    return null; // невідомий пояс — краще промовчати, ніж будити о третій ночі
  }
}

/**
 * Чи час надсилати цій підписці.
 *
 * `graceMin` — наскільки пізно ще не пізно. Планувальник може спізнитись
 * (Vercel Hobby взагалі має похибку до години), тож слот лишається
 * «відкритим» ще якийсь час після свого моменту. Але не до безкінечності:
 * нагадування о 20:00, що прийшло опівночі, гірше за жодного.
 *
 * Дедуплікація по last_sent: той самий слот не спрацює двічі, скільки б
 * разів планувальник не постукав.
 */
export function isDue(sub: PushSub, now: Date, graceMin = 45): boolean {
  const cur = localMinutes(now, sub.tz);
  if (cur === null) return false;

  const slots = (sub.times || [])
    .map(parseHHMM)
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b);
  if (!slots.length) return false;

  // найпізніший слот, який уже настав і ще не протух
  const due = slots.filter((s) => s <= cur && cur - s <= graceMin).pop();
  if (due === undefined) return false;

  if (!sub.last_sent) return true;
  const last = new Date(sub.last_sent);
  if (Number.isNaN(last.getTime())) return true;

  // момент цього слоту сьогодні за місцевим часом людини
  const slotAt = new Date(now.getTime() - (cur - due) * 60_000);
  // хвилина туди-сюди: last_sent пишеться вже після надсилання
  return slotAt.getTime() - last.getTime() > 60_000;
}

/** Репліки нагадувань. Ті самі, що й у Хатині, але тут вони потрібні серверу. */
const LINES: Record<string, string[]> = {
  uk: [
    "Дерево не поспішає. Але воно там.",
    "Хвилина в саду — теж повернення.",
    "Можна просто зайти й нічого не робити.",
    "Як ти зараз? Без слів, одним дотиком.",
    "Сад на місці. Чекає, не нагадує двічі.",
  ],
  en: [
    "The tree is in no rush. But it's there.",
    "A minute in the garden is a return too.",
    "You can just come in and do nothing.",
    "How are you? No words, one tap.",
    "The garden is here. Waiting, not nagging.",
  ],
};

export function pickLine(lang: string): string {
  const list = LINES[lang === "en" ? "en" : "uk"];
  return list[Math.floor(Math.random() * list.length)];
}
