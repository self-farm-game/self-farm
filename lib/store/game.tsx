"use client";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { JournalDay } from "@/lib/mock-data/content";
import { DROP_POOL } from "@/lib/mock-data/items";
import { setMuted as setSoundMuted } from "@/lib/sound/sound";

// This local store stands in for Supabase. Every field maps to a table/column
// in lib/supabase/schema.sql, so swapping the persistence layer later is
// mechanical: replace the localStorage read/write with Supabase queries.

export interface GameState {
  onboarded: boolean;
  day: number;
  streak: number;
  totalXp: number;
  questsDone: number;
  runesCount: number;
  ownedItems: string[]; // item names found
  journal: JournalDay[];
  muted: boolean;
  bombomIdx: number;
}

// Pre-beta: every visitor starts from zero (no DB/auth yet — state lives in
// the browser via localStorage). All stats begin empty.
const SEED: GameState = {
  onboarded: false,
  day: 1,
  streak: 0,
  totalXp: 0,
  questsDone: 0,
  runesCount: 0,
  ownedItems: [],
  journal: [],
  muted: false,
  bombomIdx: 0,
};

const KEY = "self-farm-state-v1";

export interface SessionResult {
  xp: number;
  item: { icon: string; name: string; desc: string } | null;
}

interface Ctx {
  state: GameState;
  hydrated: boolean;
  plantTree: () => void;
  nextBombom: () => void;
  toggleMute: () => void;
  reset: () => void;
  // records a completed care session and returns the reward
  recordSession: (input: {
    states: string[];
    energy: string | null;
    tension: string | null;
    note?: string;
    questTitle: string;
    questXp: number;
    after: string;
    reflection?: string;
  }) => SessionResult;
}

const GameContext = createContext<Ctx | null>(null);

function rollDrop() {
  const r = Math.random();
  if (r < 0.45) return DROP_POOL[Math.floor(Math.random() * DROP_POOL.length)];
  return null;
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(SEED);
  const [hydrated, setHydrated] = useState(false);
  const first = useRef(true);

  // hydrate from localStorage once on the client
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...SEED, ...JSON.parse(raw) });
    } catch {}
    setHydrated(true);
  }, []);

  // persist + mirror mute into the sound engine
  useEffect(() => {
    if (!hydrated) return;
    setSoundMuted(state.muted);
    if (first.current) {
      first.current = false;
      return;
    }
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {}
  }, [state, hydrated]);

  const plantTree = () => setState((s) => ({ ...s, onboarded: true }));
  const nextBombom = () => setState((s) => ({ ...s, bombomIdx: s.bombomIdx + 1 }));
  const toggleMute = () => setState((s) => ({ ...s, muted: !s.muted }));
  const reset = () => {
    try {
      localStorage.removeItem(KEY);
    } catch {}
    setState({ ...SEED, onboarded: true });
  };

  const recordSession: Ctx["recordSession"] = (input) => {
    const drop = rollDrop();
    const reward: SessionResult = {
      xp: input.questXp,
      item: drop ? { icon: drop.icon, name: drop.name, desc: drop.desc } : null,
    };
    setState((s) => {
      const entry = {
        time: new Date().toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" }),
        state: input.states.length ? input.states.join(" + ") : "Не знаю",
        energy: input.energy || "—",
        tension: input.tension,
        quest: input.questTitle,
        after: input.after,
        reward: `+${input.questXp} XP${drop ? " · " + drop.name : ""}`,
        note: input.reflection || null,
      };
      const journal = [...s.journal];
      const todayIdx = journal.findIndex((d) => d.day === "Сьогодні");
      if (todayIdx >= 0) {
        journal[todayIdx] = { ...journal[todayIdx], entries: [entry, ...journal[todayIdx].entries] };
      } else {
        journal.unshift({ day: "Сьогодні", entries: [entry] });
      }
      const ownedItems = drop && !s.ownedItems.includes(drop.name) ? [...s.ownedItems, drop.name] : s.ownedItems;
      return {
        ...s,
        totalXp: s.totalXp + input.questXp,
        questsDone: s.questsDone + 1,
        ownedItems,
        journal,
      };
    });
    return reward;
  };

  return (
    <GameContext.Provider
      value={{ state, hydrated, plantTree, nextBombom, toggleMute, reset, recordSession }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const c = useContext(GameContext);
  if (!c) throw new Error("useGame must be used within GameProvider");
  return c;
}
