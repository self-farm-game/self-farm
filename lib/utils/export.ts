// Експорт збереження. Усе робиться в браузері — нічого нікуди не
// надсилається, файл просто падає в «Завантаження».

import type { GameState } from "@/lib/store/game";
import { levelInfo } from "@/lib/utils/xp";
import { t } from "@/lib/mock-data/i18n";
import { moodLabel, outcomeLabel, questById } from "@/lib/mock-data/quests-i18n";

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
  const L = state.lang;
  const lvl = levelInfo(state.totalXp, L);
  const out: string[] = [];
  out.push("# " + t(L, "file.journal_title"));
  out.push("");
  out.push(
    t(L, "file.exported", { date: today(), level: lvl.name, xp: state.totalXp, day: state.day }),
  );
  out.push("");

  if (!state.journal?.length) {
    out.push(t(L, "file.empty"));
  }
  for (const day of state.journal || []) {
    out.push(`## ${day.day === "Сьогодні" ? t(L, "jr.today") : day.day}`);
    out.push("");
    for (const e of day.entries) {
      const bits = [e.time, e.state].filter(Boolean);
      out.push(`**${bits.join(" · ")}**`);
      const meta: string[] = [];
      if (e.energy && e.energy !== "—") meta.push(`${t(L, "file.energy")}: ${e.energy}`);
      if (e.tension) meta.push(`${t(L, "file.tension")}: ${e.tension}`);
      if (meta.length) out.push(meta.join(" · "));
      if (e.quest) out.push(`${t(L, "file.path")}: ${e.quest}${e.after ? ` → ${e.after}` : ""}`);
      if (e.reward) out.push(`${t(L, "file.reward")}: ${e.reward}`);
      if (e.note) out.push(`> ${e.note}`);
      out.push("");
    }
  }

  const stats = Object.entries(state.questStats || {});
  if (stats.length) {
    out.push("## " + t(L, "file.what_worked"));
    out.push("");
    out.push(`| ${t(L, "file.col_path")} | ${t(L, "file.col_runs")} | ${t(L, "file.col_helped")} |`);
    out.push("| --- | --- | --- |");
    for (const [id, st] of stats.sort((a, b) => b[1].runs - a[1].runs)) {
      const q = questById(L, id);
      out.push(`| ${q ? q.title : id} | ${st.runs} | ${st.helped} |`);
    }
    out.push("");
  }

  download(`self-farm-${L === "en" ? "journal" : "zhurnal"}-${today()}.md`, out.join("\n"), "text/markdown");
}

/** Сирий лог проходжень — якщо захочеться покрутити цифри самому. */
export function exportLogCsv(state: GameState) {
  const L = state.lang;
  const rows = [t(L, "file.csv_head")];
  for (const l of state.questLog || []) {
    const q = questById(L, l.q);
    const cell = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    rows.push(
      [
        cell(new Date(l.at).toISOString()),
        cell(q ? q.title : l.q),
        cell(l.t),
        cell(moodLabel(L, l.m) || l.m),
        cell(outcomeLabel(L, l.o)),
        String(l.s),
      ].join(","),
    );
  }
  download(`self-farm-log-${today()}.csv`, "﻿" + rows.join("\n"), "text/csv");
}
