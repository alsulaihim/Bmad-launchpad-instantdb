/**
 * Auth Callback Route
 * Handles OAuth and magic link callbacks from Supabase
 */

import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");

  console.log("Auth callback - URL:", requestUrl.href);
  console.log("Auth callback - Code:", code ? "present" : "missing");

  if (code) {
    try {
      const cookieStore = await cookies();

      // Create response that we'll attach cookies to
      const response = NextResponse.redirect(new URL("/dashboard", requestUrl.origin));

      // Create Supabase client that will set cookies on the response
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => {
                console.log("Setting cookie on response:", name);
                response.cookies.set(name, value, options);
              });
            },
          },
        }
      );

      console.log("Auth callback - Exchanging code for session...");

      // Exchange the code for a session - this will trigger setAll above
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Auth callback error:", error);
        return NextResponse.redirect(new URL("/auth/login?error=auth_error", requestUrl.origin));
      }

      console.log("Auth callback - Session established:", !!data.session);
      console.log("Auth callback - User ID:", data.session?.user?.id);

      // Return the response with cookies attached
      return response;
    } catch (err) {
      console.error("Auth callback exception:", err);
      return NextResponse.redirect(new URL("/auth/login?error=exception", requestUrl.origin));
    }
  }

  console.log("Auth callback - No code provided, redirecting to login");
  return NextResponse.redirect(new URL("/auth/login", requestUrl.origin));
}
