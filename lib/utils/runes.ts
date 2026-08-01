import { RUNE_BRANCHES, type RuneNode } from "@/lib/mock-data/runes";
import type { GameState } from "@/lib/store/game";

// Mirrors the (simple) unlock rules used on the Runes screen, so the hollow
// easter egg only offers runes the player has actually earned.
export function unlockedRunes(state: GameState): RuneNode[] {
  const sessions = state.journal.reduce((a, d) => a + d.entries.length, 0);
  const notes = state.journal.reduce(
    (a, d) => a + d.entries.filter((e) => e.note).length,
    0,
  );
  const ok: Record<string, boolean> = {
    sprout: state.onboarded,
    move: state.questsDone >= 3,
    return: sessions >= 3,
    words: notes >= 3,
  };
  const all: RuneNode[] = RUNE_BRANCHES.flatMap((b) => b.runes);
  return all.filter((r) => ok[r.id]);
}

export function runeById(id: string | null): RuneNode | null {
  if (!id) return null;
  for (const b of RUNE_BRANCHES) {
    const found = b.runes.find((r) => r.id === id);
    if (found) return found;
  }
  return null;
}
