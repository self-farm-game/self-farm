"use client";
/**
 * Нагадування повернутись у сад.
 *
 * Працює у двох режимах, і це не дубль, а запасний варіант:
 *
 *   push     — сервер шле сповіщення через service worker. Приходить
 *              із закритим браузером. Основний режим.
 *   таймер   — якщо push недоступний (немає ключів, iPhone у вкладці,
 *              людина не дала дозвіл серверу), лишається старий таймер
 *              усередині сторінки. Він працює, поки вкладка відкрита.
 *
 * Обидва одночасно не вмикаються: якщо підписка є, таймер мовчить, щоб
 * одне нагадування не прийшло двічі.
 *
 * Компонент нічого не малює.
 */
import { useEffect, useRef, useState } from "react";
import { useGame } from "@/lib/store/game";
import { t } from "@/lib/mock-data/i18n";
import { pushState, registerSW } from "@/lib/push/client";

/** "20:00" → хвилини від півночі. Некоректний рядок → null. */
export function parseTime(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (h < 0 || h > 23 || mi < 0 || mi > 59) return null;
  return h * 60 + mi;
}

const LINE_KEYS = ["rem.line1", "rem.line2", "rem.line3", "rem.line4", "rem.line5"];

export default function Reminders() {
  const { state, hydrated, markReminded } = useGame();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pushOn, setPushOn] = useState<boolean | null>(null);

  const on = state.reminders?.on;
  const times = (state.reminders?.times || []).join(",");
  const lastRemindAt = state.lastRemindAt || 0;

  // Service worker реєструємо завжди, не лише коли нагадування увімкнені:
  // так він уже стоїть, коли людина натисне вмикач, і підписка не чекає
  // зайвий круг.
  useEffect(() => {
    if (hydrated) void registerSW();
  }, [hydrated]);

  // Чи є жива підписка. Якщо є — локальний таймер не потрібен.
  useEffect(() => {
    if (!hydrated) return;
    let alive = true;
    void pushState().then((s) => alive && setPushOn(s === "subscribed"));
    return () => {
      alive = false;
    };
  }, [hydrated, on, times]);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!hydrated || !on) return;
    if (pushOn !== false) return; // ще не знаємо або push працює — не дублюємо
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const slots = (state.reminders?.times || [])
      .map(parseTime)
      .filter((v): v is number => v !== null)
      .sort((a, b) => a - b);
    if (slots.length === 0) return;

    const tick = () => {
      const now = new Date();
      const cur = now.getHours() * 60 + now.getMinutes();

      const due = slots.filter((sl) => sl <= cur).pop();
      if (due !== undefined) {
        const slotDate = new Date(now);
        slotDate.setHours(Math.floor(due / 60), due % 60, 0, 0);
        if (slotDate.getTime() > lastRemindAt) {
          try {
            new Notification("Self-Farm", {
              body: t(state.lang, LINE_KEYS[Math.floor(Math.random() * LINE_KEYS.length)]),
              icon: "/assets/icons/icon-192.png",
              tag: "self-farm-reminder",
            });
          } catch {}
          markReminded(slotDate.getTime());
        }
      }

      const next = slots.find((sl) => sl > cur);
      const waitMin = next !== undefined ? next - cur : 24 * 60 - cur + slots[0];
      // не спимо довше години за раз: так переживаємо зміну дати й сон машини
      const wait = Math.min(waitMin * 60_000, 60 * 60_000) + 2000;
      timer.current = setTimeout(tick, wait);
    };

    tick();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [hydrated, on, times, pushOn, lastRemindAt, state.reminders, state.lang, markReminded]);

  return null;
}
