// Експорт збереження. Усе робиться в браузері — нічого нікуди не
// надсилається, файл просто падає в «Завантаження».

import type { GameState } from "@/lib/store/game";
import { levelInfo } from "@/lib/utils/xp";
import { MOOD_BY_KEY, QUEST_BY_ID, OUTCOMES } from "@/lib/mock-data/quests-v2";

export const EXPORT_VERSION = 1;

function today() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function download(name: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime + ";charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // даємо браузеру дочитати blob перед тим, як його відпустити
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Повне збереження — його ж приймає «Відновити з файлу». */
export function exportSave(state: GameState) {
  const payload = {
    app: "self-farm",
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    state,
  };
  download(`self-farm-${today()}.json`, JSON.stringify(payload, null, 2), "application/json");
}

/** Журнал у читабельному вигляді — для себе, не для гри. */
export function exportJournal(state: GameState) {
  const lvl = levelInfo(state.totalXp);
  const out: string[] = [];
  out.push("# Self-Farm · фермерський журнал");
  out.push("");
  out.push(`Вивантажено ${today()} · ${lvl.name} · ${state.totalXp} XP · день ${state.day}`);
  out.push("");

  if (!state.journal?.length) {
    out.push("_Поки порожньо._");
  }
  for (const day of state.journal || []) {
    out.push(`## ${day.day}`);
    out.push("");
    for (const e of day.entries) {
      const bits = [e.time, e.state].filter(Boolean);
      out.push(`**${bits.join(" · ")}**`);
      const meta: string[] = [];
      if (e.energy && e.energy !== "—") meta.push(`енергія: ${e.energy}`);
      if (e.tension) meta.push(`напруга: ${e.tension}`);
      if (meta.length) out.push(meta.join(" · "));
      if (e.quest) out.push(`Стежка: ${e.quest}${e.after ? ` → ${e.after}` : ""}`);
      if (e.reward) out.push(`Нагорода: ${e.reward}`);
      if (e.note) out.push(`> ${e.note}`);
      out.push("");
    }
  }

  const stats = Object.entries(state.questStats || {});
  if (stats.length) {
    out.push("## Що працювало");
    out.push("");
    out.push("| Стежка | Пройдено | Допомогло |");
    out.push("| --- | --- | --- |");
    for (const [id, st] of stats.sort((a, b) => b[1].runs - a[1].runs)) {
      const q = QUEST_BY_ID[id];
      out.push(`| ${q ? q.title : id} | ${st.runs} | ${st.helped} |`);
    }
    out.push("");
  }

  download(`self-farm-journal-${today()}.md`, out.join("\n"), "text/markdown");
}

/** Сирий лог проходжень — якщо захочеться покрутити цифри самому. */
export function exportLogCsv(state: GameState) {
  const outcome: Record<string, string> = Object.fromEntries(OUTCOMES.map((o) => [o.key, o.label]));
  const rows = [["дата", "стежка", "шаблон", "стан", "результат", "секунд"].join(",")];
  for (const l of state.questLog || []) {
    const q = QUEST_BY_ID[l.q];
    const mood = MOOD_BY_KEY[l.m];
    const cell = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    rows.push(
      [
        cell(new Date(l.at).toISOString()),
        cell(q ? q.title : l.q),
        cell(l.t),
        cell(mood ? mood.label : l.m),
        cell(outcome[l.o] || l.o),
        String(l.s),
      ].join(","),
    );
  }
  download(`self-farm-log-${today()}.csv`, "﻿" + rows.join("\n"), "text/csv");
}
