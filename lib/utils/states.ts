import { STATE_DEFS, type StateDef } from "@/lib/mock-data/states";

// Reorder the state chips so the person sees the most relevant ones first:
// their own most-picked states lead, everything else falls back to the tuned
// default priority. Ordering is purely cosmetic — every state stays available.
//
// counts: how many times this user has picked each state key (persisted).
export function orderStates(counts: Record<string, number> = {}): StateDef[] {
  const maxCount = Math.max(1, ...Object.values(counts));
  return [...STATE_DEFS].sort((a, b) => {
    // personal signal (0..~60) + base priority (0..100)
    const score = (s: StateDef) => ((counts[s.key] || 0) / maxCount) * 60 + s.priority;
    const diff = score(b) - score(a);
    if (diff !== 0) return diff;
    return a.label.localeCompare(b.label, "uk");
  });
}

// "Не знаю" is a reset — if picked, it clears the rest.
export function toggleState(current: string[], key: string): string[] {
  if (key === "unknown") return current.includes("unknown") ? [] : ["unknown"];
  const next = current.filter((k) => k !== "unknown");
  return next.includes(key) ? next.filter((k) => k !== key) : [...next, key];
}
