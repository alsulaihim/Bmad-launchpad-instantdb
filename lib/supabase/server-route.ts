import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Create a Supabase client for use in Server Routes (Route Handlers)
 * This properly handles cookie-based authentication for API routes
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              console.log("Setting cookie:", name);
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            console.error("Error setting cookies:", error);
            throw error; // Re-throw to surface the error
          }
        },
      },
    }
  );
}
