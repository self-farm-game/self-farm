"use client";
/**
 * Мʼякі нагадування повернутись у сад.
 *
 * Чесно про межі: сервера для push немає, тож це локальні сповіщення
 * браузера. Вони спрацьовують, поки вкладка з грою відкрита (нехай і у
 * фоні). Закрив браузер — нагадування не прийде. Саме так і написано
 * в налаштуваннях, щоб ніхто не чекав дзвінка о восьмій із закритого
 * ноутбука.
 *
 * Компонент нічого не малює — лише тримає таймер.
 */
import { useEffect, useRef } from "react";
import { useGame } from "@/lib/store/game";

/** "20:00" → хвилини від півночі. Некоректний рядок → null. */
export function parseTime(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (h < 0 || h > 23 || mi < 0 || mi > 59) return null;
  return h * 60 + mi;
}

const LINES = [
  "Дерево не поспішає. Але воно там.",
  "Хвилина в саду — теж повернення.",
  "Можна просто зайти й нічого не робити.",
  "Як ти зараз? Без слів, одним дотиком.",
  "Сад на місці. Чекає, не нагадує двічі.",
];

export default function Reminders() {
  const { state, hydrated, markReminded } = useGame();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const on = state.reminders?.on;
  const times = (state.reminders?.times || []).join(",");
  const lastRemindAt = state.lastRemindAt || 0;

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!hydrated || !on) return;
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

      // найближчий слот, що вже настав і ще не показувався сьогодні
      const due = slots.filter((sl) => sl <= cur).pop();
      if (due !== undefined) {
        const slotDate = new Date(now);
        slotDate.setHours(Math.floor(due / 60), due % 60, 0, 0);
        if (slotDate.getTime() > lastRemindAt) {
          try {
            new Notification("Self-Farm", {
              body: LINES[Math.floor(Math.random() * LINES.length)],
              icon: "/assets/sprites/garden/BomBom.png",
              tag: "self-farm-reminder",
            });
          } catch {}
          markReminded(slotDate.getTime());
        }
      }

      // наступний слот сьогодні або перший завтра
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
  }, [hydrated, on, times, lastRemindAt, state.reminders, markReminded]);

  return null;
}
