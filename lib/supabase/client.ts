import { createClient } from "@supabase/supabase-js";

// Validate environment variables at build time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check your .env.local file."
  );
}

/**
 * Supabase client for client-side operations
 * Uses the anon key which has RLS (Row Level Security) policies applied
 * @see https://supabase.com/docs/guides/auth/row-level-security
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

