import { createBrowserClient } from "@supabase/ssr";

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
 * Uses SSR package to read auth from cookies (set by server-side auth callback)
 * This ensures auth state is shared between server and client
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

