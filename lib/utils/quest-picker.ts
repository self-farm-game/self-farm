// Підбір квестів під стан — з урахуванням того, що вже спрацьовувало.
//
// Після кожного квесту гравець каже «допомогло / нічого не змінилось / не
// підійшло». Ці відповіді лягають у state.questStats (по конкретному квесту) і
// state.comboStats (по парі «стан + шаблон T01–T20»). Далі вони зсувають
// ранжування: що допомагало — піднімається, що не підійшло — опускається.
// Нічого не блокується назавжди: навіть «провалений» квест може знову
// випасти, просто рідше.

import { QUESTS, MOOD_BY_KEY, Quest, MoodKey } from "@/lib/mock-data/quests-v2";
import type { GameState, QuestStat } from "@/lib/store/game";

const DAY = 24 * 60 * 60 * 1000;

/** Нормована «користь» зі статистики: приблизно від -1.3 (шкодило) до +1 (заходило). */
export function statWeight(s: QuestStat | undefined): number {
  if (!s || !s.runs) return 0;
  return (s.helped - 1.3 * s.nope - 0.25 * s.same) / (1 + s.runs);
}

export interface ScoredQuest {
  quest: Quest;
  score: number;
  /** чому саме цей — для підказки в інтерфейсі */
  why: "exact" | "near" | "fallback";
}

export function scoreQuest(state: GameState, q: Quest, mood: MoodKey, now = Date.now()): ScoredQuest {
  const m = MOOD_BY_KEY[mood];
  const near = m ? (m.near as string[]) : [];
  let why: ScoredQuest["why"] = "fallback";
  let base = 0;
  if (q.mood === mood) {
    base = 3;
    why = "exact";
  } else if (near.includes(q.mood)) {
    base = 1.5;
    why = "near";
  }

  const qs = state.questStats?.[q.id];
  const cs = state.comboStats?.[mood + "|" + q.template];
  const pref = statWeight(qs) * 1.0 + statWeight(cs) * 0.6;

  // не підсовуємо одне й те саме два дні поспіль
  let recency = 0;
  if (qs?.lastAt) {
    const age = now - qs.lastAt;
    if (age < 2 * DAY) recency = -1.4;
    else if (age < 7 * DAY) recency = -0.45;
  }

  // легкий шум, щоб набір не був щоразу ідентичним
  const jitter = Math.random() * 0.5;

  return { quest: q, score: base + pref * 1.4 + recency + jitter, why };
}

/**
 * Три (або n) квести під стан. Спершу «свої», потім сусідні стани, і лише
 * якщо геть нічого не лишилось — будь-які. Шаблони по можливості не
 * повторюються, щоб набір не був трьома варіаціями однієї вправи.
 */
export function pickQuests(state: GameState, mood: MoodKey, n = 3): Quest[] {
  const now = Date.now();
  const scored = QUESTS.map((q) => scoreQuest(state, q, mood, now)).sort((a, b) => b.score - a.score);

  const out: Quest[] = [];
  const usedTemplates = new Set<string>();

  // перший прохід — різні шаблони
  for (const s of scored) {
    if (out.length >= n) break;
    if (usedTemplates.has(s.quest.template)) continue;
    out.push(s.quest);
    usedTemplates.add(s.quest.template);
  }
  // другий — добираємо чим є
  for (const s of scored) {
    if (out.length >= n) break;
    if (out.some((q) => q.id === s.quest.id)) continue;
    out.push(s.quest);
  }
  return out.slice(0, n);
}

export interface MoodInsight {
  mood: MoodKey;
  label: string;
  icon: string;
  runs: number;
  helped: number;
  /** частка «допомогло», 0..1; null якщо проходжень ще нема */
  rate: number | null;
  /** шаблон, який у цьому стані спрацьовує найкраще */
  bestTemplate: string | null;
}

/** Зведення для екрана статистики: що і в якому стані спрацьовує. */
export function moodInsights(state: GameState): MoodInsight[] {
  const byMood = new Map<string, { runs: number; helped: number; tpl: Map<string, QuestStat> }>();
  for (const [key, st] of Object.entries(state.comboStats || {})) {
    const [mood, template] = key.split("|");
    if (!mood || !template) continue;
    const slot = byMood.get(mood) || { runs: 0, helped: 0, tpl: new Map() };
    slot.runs += st.runs;
    slot.helped += st.helped;
    slot.tpl.set(template, st);
    byMood.set(mood, slot);
  }
  const out: MoodInsight[] = [];
  for (const [mood, slot] of byMood) {
    const m = MOOD_BY_KEY[mood];
    let bestTemplate: string | null = null;
    let best = -Infinity;
    for (const [t, st] of slot.tpl) {
      const w = statWeight(st);
      if (w > best) {
        best = w;
        bestTemplate = t;
      }
    }
    out.push({
      mood: mood as MoodKey,
      label: m?.label || mood,
      icon: m?.icon || "·",
      runs: slot.runs,
      helped: slot.helped,
      rate: slot.runs ? slot.helped / slot.runs : null,
      bestTemplate: best > 0 ? bestTemplate : null,
    });
  }
  return out.sort((a, b) => b.runs - a.runs);
}
