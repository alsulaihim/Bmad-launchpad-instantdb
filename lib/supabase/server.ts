import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Missing Supabase service role key. This should only be used server-side."
  );
}

/**
 * Supabase admin client for server-side operations
 * Uses the service role key which bypasses RLS policies
 * WARNING: Only use in API routes or server components, never expose to client
 * @see https://supabase.com/docs/guides/api#the-service_role-key
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

