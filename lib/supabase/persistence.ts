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
