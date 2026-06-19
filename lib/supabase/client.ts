// Supabase client stub.
//
// The prototype runs entirely on mock data + localStorage (see lib/store/game.tsx),
// so Supabase is NOT required to run the app. This file is the seam where real
// persistence will plug in. When you're ready:
//
//   1. npm i @supabase/supabase-js
//   2. fill NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
//   3. run the SQL in lib/supabase/schema.sql against your project
//   4. uncomment the createClient call below and swap the store's
//      localStorage reads/writes for Supabase queries (table-by-table).

// import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anon);

export function getSupabase() {
  if (!isSupabaseConfigured) return null;
  // return createClient(url!, anon!);
  return null; // remove once @supabase/supabase-js is installed
}
