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
  hasOAuthParams,
  completeOAuthRedirect,
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
  stateCounts: Record<string, number>; // how often each state key was picked
  dayKey: string; // calendar day the daily counter belongs to (YYYY-MM-DD)
  dailyDone: number; // quests completed on dayKey
  // --- daily quest hub ---
  activeQuestIds: string[]; // quests unlocked by the latest check-in
  activeStates: string[]; // state keys of the latest check-in (for display)
  activeUntil: number; // epoch ms of the current window end (legacy; = lastCheckinAt+gap)
  lastCheckinAt: number; // epoch ms of the last check-in (gates the next one)
  doneToday: { id: string; title: string; icon: string; time: string }[]; // finished on dayKey
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
  stateCounts: {},
  dayKey: "",
  dailyDone: 0,
  activeQuestIds: [],
  activeStates: [],
  activeUntil: 0,
  lastCheckinAt: 0,
  doneToday: [],
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
  error: string | null;
}

interface Ctx {
  state: GameState;
  hydrated: boolean;
  auth: AuthState;
  dailyDone: number; // completed today (0 if the stored day is stale)
  dailyLeft: number; // DAILY_QUEST_LIMIT - dailyDone
  checkinLeftMs: number; // ms left on the current check-in window
  canCheckin: boolean; // true once the 3h gap since the last check-in has passed
  nextCheckinInMs: number; // ms until a new check-in is allowed (0 = now)
  openCheckin: (stateKeys: string[], questIds: string[]) => void;
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
    stateKeys?: string[];
    energy: string | null;
    tension: string | null;
    note?: string;
    questId?: string;
    questIcon?: string;
    questTitle: string;
    questXp: number;
    after: string;
    reflection?: string;
  }) => SessionResult;
}

const GameContext = createContext<Ctx | null>(null);

export const QUESTS_PER_CHECKIN = 3; // matched quests unlocked by each check-in
export const CHECKIN_GAP_MS = 3 * 60 * 60 * 1000; // must wait 3h between check-ins
// kept for older references (no longer a hard daily cap)
export const DAILY_QUEST_LIMIT = 5;
export const CHECKIN_WINDOW_MS = CHECKIN_GAP_MS;

// local calendar day, e.g. "2026-07-24"
export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function rollDrop() {
  const r = Math.random();
  if (r < 0.45) return DROP_POOL[Math.floor(Math.random() * DROP_POOL.length)];
  return null;
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(SEED);
  const [hydrated, setHydrated] = useState(false);
  const [auth, setAuth] = useState<AuthState>({ ready: false, email: null, isAnonymous: true, error: null });
  const first = useRef(true);
  const userId = useRef<string | null>(null);
  const stateRef = useRef<GameState>(SEED);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const oauthError = useRef<string | null>(null);
  stateRef.current = state;

  // per-user localStorage cache key (so accounts don't bleed on one browser)
  const localKey = () => (isSupabaseConfigured && userId.current ? `${KEY}:${userId.current}` : KEY);

  // daily quest allowance (resets on a new calendar day)
  const isToday = state.dayKey === todayKey();
  const dailyDone = isToday ? state.dailyDone : 0;
  // time since the last check-in; a new one is allowed after CHECKIN_GAP_MS
  const sinceCheckin = Date.now() - (state.lastCheckinAt || 0);
  const nextCheckinInMs = Math.max(0, CHECKIN_GAP_MS - sinceCheckin);
  const canCheckin = nextCheckinInMs <= 0;
  // how many of this check-in's quests are still open
  const activeLeft = (state.activeQuestIds || []).length;
  const checkinLeftMs = nextCheckinInMs; // (kept name for existing UI refs)
  const dailyLeft = activeLeft; // (kept name) → remaining in the current set

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
      setAuth({ ready: true, email: null, isAnonymous: false, error: null });
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
        setAuth({ ready: true, email: user.email, isAnonymous: false, error: null });
      } else {
        userId.current = null;
        setAuth({ ready: true, email: null, isAnonymous: true, error: oauthError.current });
      }
      setHydrated(true);
    };

    // onAuthStateChange emits INITIAL_SESSION immediately, then SIGNED_IN /
    // SIGNED_OUT (covers email login, Google OAuth return, restore, sign-out).
    let done = false;
    let unsub: (() => void) | null = null;
    let cancelled = false;

    const start = () => {
      if (cancelled) return;
      unsub = subscribeAuth((user) => {
        const firstRun = !done;
        done = true;
        apply(user, firstRun);
      });
    };

    if (hasOAuthParams()) {
      // Returning from Google: finish the code→session exchange FIRST, so the
      // app doesn't navigate away (stripping ?code=) and bounce back to the gate.
      completeOAuthRedirect().then((r) => {
        oauthError.current = r.error;
        start();
      });
    } else {
      start();
    }

    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
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

  // Register a mood check-in: unlocks the matched quests for CHECKIN_WINDOW_MS.
  const openCheckin = (stateKeys: string[], questIds: string[]) => {
    // only allowed once 3h have passed since the last check-in
    if (Date.now() - (stateRef.current.lastCheckinAt || 0) < CHECKIN_GAP_MS) return;
    setState((s) => {
      const tk = todayKey();
      const rolledDone = s.dayKey === tk ? s.doneToday : [];
      const now = Date.now();
      return {
        ...s,
        dayKey: tk,
        doneToday: rolledDone,
        activeStates: stateKeys,
        activeQuestIds: questIds,
        lastCheckinAt: now,
        activeUntil: now + CHECKIN_GAP_MS,
      };
    });
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
      // tally picked states so the chips reorder toward this person's own patterns
      const stateCounts = { ...(s.stateCounts || {}) };
      for (const k of input.stateKeys || []) stateCounts[k] = (stateCounts[k] || 0) + 1;
      // roll the daily counter over on a new calendar day
      const tk = todayKey();
      const sameDay = s.dayKey === tk;
      const dailyDone = (sameDay ? s.dailyDone : 0) + 1;
      const doneEntry = {
        id: input.questId || "",
        title: input.questTitle,
        icon: input.questIcon || "✦",
        time: new Date().toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" }),
      };
      const doneToday = [doneEntry, ...(sameDay ? s.doneToday : [])];
      // consume this quest from the active set
      const activeQuestIds = (s.activeQuestIds || []).filter((id) => id !== input.questId);
      return {
        ...s,
        totalXp: s.totalXp + input.questXp,
        questsDone: s.questsDone + 1,
        ownedItems,
        journal,
        stateCounts,
        dayKey: tk,
        dailyDone,
        doneToday,
        activeQuestIds,
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
    oauthError.current = null;
    await signOutUser();
    userId.current = null;
    setState(SEED);
    setAuth({ ready: true, email: null, isAnonymous: true, error: oauthError.current }); // show the gate again
  };

  return (
    <GameContext.Provider
      value={{ state, hydrated, auth, dailyDone, dailyLeft, checkinLeftMs, canCheckin, nextCheckinInMs, openCheckin, plantTree, nextBombom, toggleMute, reset, signUp, signIn, signInGoogle, signOut, recordSession }}
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
