"use client";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { JournalDay } from "@/lib/mock-data/content";
import { DROP_POOL } from "@/lib/mock-data/items";
import { setMuted as setSoundMuted } from "@/lib/sound/sound";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  loadRemote,
  saveRemote,
  registerEmail,
  signInEmail,
  signOutUser,
  signInWithGoogle,
  subscribeAuth,
} from "@/lib/supabase/persistence";

// State is cached in localStorage AND (when Supabase is configured) saved to the
// cloud per anonymous user. Without Supabase env vars the app runs fine on
// localStorage alone. Every field maps to the `state` jsonb in player_saves.

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

export interface AuthState {
  ready: boolean;
  email: string | null;
  isAnonymous: boolean;
}

interface Ctx {
  state: GameState;
  hydrated: boolean;
  auth: AuthState;
  plantTree: () => void;
  nextBombom: () => void;
  toggleMute: () => void;
  reset: () => void;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
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
  const [auth, setAuth] = useState<AuthState>({ ready: false, email: null, isAnonymous: true });
  const first = useRef(true);
  const userId = useRef<string | null>(null);
  const stateRef = useRef<GameState>(SEED);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  stateRef.current = state;

  // per-user localStorage cache key (so accounts don't bleed on one browser)
  const localKey = () => (isSupabaseConfigured && userId.current ? `${KEY}:${userId.current}` : KEY);

  // load: decide signed-in vs gate; render fast from per-user cache
  useEffect(() => {
    // No backend configured → local-only play (no gate), so dev/preview works.
    if (!isSupabaseConfigured) {
      let initial: GameState = SEED;
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) initial = { ...SEED, ...JSON.parse(raw) };
      } catch {}
      setState(initial);
      setHydrated(true);
      setAuth({ ready: true, email: null, isAnonymous: false });
      return;
    }

    // Apply an auth state (signed-in user or null). `fresh` = first run / account
    // switch → (re)load that account's cache + cloud save.
    const apply = async (user: { id: string; email: string | null } | null, fresh: boolean) => {
      if (user) {
        const changed = userId.current !== user.id;
        userId.current = user.id;
        if (fresh || changed) {
          let initial: GameState = SEED;
          let hadLocal = false;
          try {
            const raw = localStorage.getItem(`${KEY}:${user.id}`);
            if (raw) {
              initial = { ...SEED, ...JSON.parse(raw) };
              hadLocal = true;
            }
          } catch {}
          setState(initial);
          try {
            const remote = await loadRemote(user.id);
            if (remote && !hadLocal) setState({ ...SEED, ...remote });
            else if (!remote) await saveRemote(user.id, initial);
            else await saveRemote(user.id, initial);
          } catch {}
        }
        setAuth({ ready: true, email: user.email, isAnonymous: false });
      } else {
        userId.current = null;
        setAuth({ ready: true, email: null, isAnonymous: true });
      }
      setHydrated(true);
    };

    // onAuthStateChange emits INITIAL_SESSION immediately, then SIGNED_IN /
    // SIGNED_OUT (covers email login, Google OAuth return, restore, sign-out).
    let done = false;
    const unsub = subscribeAuth((user) => {
      const firstRun = !done;
      done = true;
      apply(user, firstRun);
    });
    return () => unsub();
  }, []);

  // persist: per-user localStorage immediately + debounced cloud save
  useEffect(() => {
    if (!hydrated) return;
    setSoundMuted(state.muted);
    if (first.current) {
      first.current = false;
      return;
    }
    try {
      localStorage.setItem(localKey(), JSON.stringify(state));
    } catch {}

    if (isSupabaseConfigured && userId.current) {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      const uid = userId.current;
      const snapshot = state;
      saveTimer.current = setTimeout(() => {
        saveRemote(uid, snapshot);
      }, 800);
    }
  }, [state, hydrated]);

  const plantTree = () => setState((s) => ({ ...s, onboarded: true }));
  const nextBombom = () => setState((s) => ({ ...s, bombomIdx: s.bombomIdx + 1 }));
  const toggleMute = () => setState((s) => ({ ...s, muted: !s.muted }));
  const reset = () => {
    try {
      localStorage.removeItem(KEY);
    } catch {}
    const fresh = { ...SEED, onboarded: true };
    setState(fresh);
    if (isSupabaseConfigured && userId.current) saveRemote(userId.current, fresh);
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

  // ---- auth actions (optional email/password, layered over anonymous) ----

  const signUp = async (email: string, password: string) => {
    if (!isSupabaseConfigured) return { error: "Бекенд не підключено" };
    const res = await registerEmail(email.trim(), password);
    if (res.error) return { error: res.error };
    if (!res.hasSession) {
      // email confirmation is ON — account made but no session yet
      return { error: "Акаунт створено. Підтверди пошту листом, тоді увійди." };
    }
    return { error: null }; // SIGNED_IN listener loads state + opens the gate
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) return { error: "Бекенд не підключено" };
    const res = await signInEmail(email.trim(), password);
    if (res.error) return { error: res.error };
    return { error: null }; // listener handles state
  };

  const signInGoogle = async () => {
    if (!isSupabaseConfigured) return { error: "Бекенд не підключено" };
    return await signInWithGoogle(); // redirects to Google; listener handles the return
  };

  const signOut = async () => {
    await signOutUser();
    userId.current = null;
    setState(SEED);
    setAuth({ ready: true, email: null, isAnonymous: true }); // show the gate again
  };

  return (
    <GameContext.Provider
      value={{ state, hydrated, auth, plantTree, nextBombom, toggleMute, reset, signUp, signIn, signInGoogle, signOut, recordSession }}
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
