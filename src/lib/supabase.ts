import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * True when both env vars are present. The app surfaces a friendly setup
 * message instead of crashing when Supabase has not been configured yet.
 */
export const isSupabaseConfigured = Boolean(url && anonKey)

// Fall back to harmless placeholders so importing this module never throws.
// Any actual request will fail clearly until real values are provided.
export const supabase = createClient(
  url ?? 'https://placeholder.supabase.co',
  anonKey ?? 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)
