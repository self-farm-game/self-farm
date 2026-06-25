// Cloud persistence for the game state.
//
// Auth: anonymous sign-in — the visitor gets a real (but registration-free)
// Supabase auth user, so Row-Level Security can scope every save to that user.
// Requires "Anonymous sign-ins" enabled in the Supabase dashboard
// (Authentication → Providers → Anonymous) and the player_saves table from
// lib/supabase/schema.sql.

import { getSupabase } from "./client";

const TABLE = "player_saves";

// Returns the current user id, signing in anonymously if needed. null on failure.
export async function ensureAuth(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data } = await sb.auth.getSession();
    let session = data.session;
    if (!session) {
      const res = await sb.auth.signInAnonymously();
      if (res.error) {
        console.warn("[self-farm] anon sign-in failed:", res.error.message);
        return null;
      }
      session = res.data.session;
    }
    return session?.user?.id ?? null;
  } catch (e) {
    console.warn("[self-farm] ensureAuth error", e);
    return null;
  }
}

export async function loadRemote(userId: string): Promise<any | null> {
  const sb = getSupabase();
  if (!sb || !userId) return null;
  try {
    const { data, error } = await sb.from(TABLE).select("state").eq("user_id", userId).maybeSingle();
    if (error) {
      console.warn("[self-farm] loadRemote error", error.message);
      return null;
    }
    return data?.state ?? null;
  } catch (e) {
    console.warn("[self-farm] loadRemote threw", e);
    return null;
  }
}

export async function saveRemote(userId: string, state: unknown): Promise<void> {
  const sb = getSupabase();
  if (!sb || !userId) return;
  try {
    const { error } = await sb.from(TABLE).upsert(
      { user_id: userId, state, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
    if (error) console.warn("[self-farm] saveRemote error", error.message);
  } catch (e) {
    console.warn("[self-farm] saveRemote threw", e);
  }
}

// ---- email + password auth (optional; layered over anonymous) -------------

export interface AuthUser {
  id: string;
  email: string | null;
  isAnonymous: boolean;
}

export async function authInfo(): Promise<AuthUser | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data } = await sb.auth.getSession();
    const u = data.session?.user;
    if (!u) return null;
    return { id: u.id, email: u.email ?? null, isAnonymous: (u as any).is_anonymous ?? !u.email };
  } catch {
    return null;
  }
}

// Link email+password to the CURRENT (anonymous) user — keeps the same id, so
// all progress is preserved. Requires "Confirm email" OFF for instant pre-beta.
export async function linkEmail(email: string, password: string): Promise<{ error: string | null; email?: string }> {
  const sb = getSupabase();
  if (!sb) return { error: "Supabase не підключено" };
  const { data, error } = await sb.auth.updateUser({ email, password });
  if (error) return { error: error.message };
  return { error: null, email: data.user?.email ?? email };
}

export async function signInEmail(email: string, password: string): Promise<{ error: string | null; userId?: string | null; email?: string }> {
  const sb = getSupabase();
  if (!sb) return { error: "Supabase не підключено" };
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  return { error: null, userId: data.user?.id ?? null, email: data.user?.email ?? email };
}

export async function signOutUser(): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  try {
    await sb.auth.signOut();
  } catch {}
}

// ---- mandatory registration (real accounts; no anonymous play) ------------

export async function getSessionUser(): Promise<{ id: string; email: string | null } | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data } = await sb.auth.getSession();
    const u = data.session?.user;
    if (!u) return null;
    if ((u as any).is_anonymous) return null; // require a real account
    return { id: u.id, email: u.email ?? null };
  } catch {
    return null;
  }
}

export async function registerEmail(
  email: string,
  password: string,
): Promise<{ error: string | null; userId?: string | null; email?: string; hasSession?: boolean }> {
  const sb = getSupabase();
  if (!sb) return { error: "Бекенд не підключено" };
  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) return { error: error.message };
  return {
    error: null,
    userId: data.user?.id ?? null,
    email: data.user?.email ?? email,
    hasSession: !!data.session,
  };
}

// ---- Google OAuth + auth state subscription -------------------------------

export async function signInWithGoogle(): Promise<{ error: string | null }> {
  const sb = getSupabase();
  if (!sb) return { error: "Бекенд не підключено" };
  const { error } = await sb.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
    },
  });
  // on success the browser is redirected to Google; nothing else to do here
  return { error: error?.message ?? null };
}

// Subscribe to auth changes (restore, email sign-in, Google OAuth return,
// sign-out, token refresh). Returns an unsubscribe fn. The handler is deferred
// to avoid Supabase's "don't call APIs inside the callback" lock.
export function subscribeAuth(
  handler: (user: { id: string; email: string | null } | null, event: string) => void,
): () => void {
  const sb = getSupabase();
  if (!sb) return () => {};
  const { data } = sb.auth.onAuthStateChange((event, session) => {
    const u = session?.user;
    const info = u && !(u as any).is_anonymous ? { id: u.id, email: u.email ?? null } : null;
    setTimeout(() => handler(info, event), 0);
  });
  return () => data.subscription.unsubscribe();
}
