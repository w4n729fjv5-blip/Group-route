import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * True when both Supabase env vars are present. The UI uses this to show a
 * friendly "finish setup" message instead of crashing when the app hasn't
 * been pointed at a Supabase project yet.
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * The Supabase client, or null if the app isn't configured yet.
 * No login is used, so all access is via the public anon key.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string)
  : null;

/** Returns the client or throws a clear error if setup is incomplete. */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file."
    );
  }
  return supabase;
}
