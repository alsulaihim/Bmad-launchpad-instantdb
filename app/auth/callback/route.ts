/**
 * Auth Callback Route
 * Handles OAuth and magic link callbacks from Supabase
 */

import { createClient } from "@/lib/supabase/server-route";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");

  console.log("Auth callback - URL:", requestUrl.href);
  console.log("Auth callback - Code:", code ? "present" : "missing");

  if (code) {
    try {
      // Create a Supabase client with proper cookie handling
      const supabase = await createClient();

      console.log("Auth callback - Exchanging code for session...");

      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Auth callback error:", error);
        // Redirect to login with error
        return NextResponse.redirect(new URL("/auth/login?error=auth_error", requestUrl.origin));
      }

      console.log("Auth callback - Session established:", !!data.session);
      console.log("Auth callback - User ID:", data.session?.user?.id);

      // Verify the session is actually set
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Auth callback - Session verification:", !!session);

      // Redirect to dashboard after successful authentication
      // The session cookies are automatically handled by the Supabase SSR client
      return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
    } catch (err) {
      console.error("Auth callback exception:", err);
      return NextResponse.redirect(new URL("/auth/login?error=exception", requestUrl.origin));
    }
  }

  console.log("Auth callback - No code provided, redirecting to login");
  // If no code, redirect to login
  return NextResponse.redirect(new URL("/auth/login", requestUrl.origin));
}
