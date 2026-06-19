// Domain types for Self-Farm.
// Mock data uses these now; the same shapes map to Supabase tables later
// (see lib/supabase/schema.sql).

export type StateKey =
  | "anxious"
  | "noisy"
  | "angry"
  | "empty"
  | "tired"
  | "tense"
  | "ok"
  | "calm"
  | "unknown";

export type Energy = 1 | 2 | 3 | 4 | 5; // нема сил → несе
export type Tension = 1 | 2 | 3; // нема → сильно
export type AfterState = "lighter" | "same" | "heavier" | "unknown";
export type Rarity = "common" | "rare" | "strange";
export type RuneCategory = "state" | "action" | "return" | "clarity";

export interface Player {
  id: string;
  name: string;
  createdAt: string;
  treeName?: string;
  treeLevel: number;
  xp: number;
}

export interface CheckInSession {
  id: string;
  playerId: string;
  createdAt: string;
  day: number; // prototype day index
  state: StateKey;
  energy: Energy;
  tension: Tension;
  note?: string;
  suggestedQuestIds: string[];
  selectedQuestId?: string;
  completedQuestAttemptId?: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  why: string; // "чому це може допомогти"
  durationMinutes: number;
  category: string;
  baseXp: number;
  targetStates: StateKey[];
  energyFit: Energy[];
  isUnlocked: boolean;
  unlockHint?: string;
}

export interface QuestAttempt {
  id: string;
  playerId: string;
  questId: string;
  questTitle: string;
  checkInSessionId?: string;
  startedAt: string;
  completedAt?: string;
  day: number;
  status: "active" | "completed" | "abandoned";
  afterState?: AfterState;
  reflectionNote?: string;
  xpAwarded?: number;
  itemDropId?: string;
}

export interface Rune {
  id: string;
  title: string;
  description: string;
  category: RuneCategory;
  current: number;
  required: number;
  isUnlocked: boolean;
}

export interface Item {
  id: string;
  name: string;
  rarity: Rarity;
  description: string;
}
