/**
 * Auth Callback Route
 * Handles OAuth and magic link callbacks from Supabase
 */

import { createClient } from "@/lib/supabase/server-route";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    // Create a Supabase client with proper cookie handling
    const supabase = await createClient();

    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth callback error:", error);
      // Redirect to login with error
      return NextResponse.redirect(new URL("/auth/login?error=auth_error", requestUrl.origin));
    }

    // Redirect to dashboard after successful authentication
    // The session cookies are automatically handled by the Supabase SSR client
    return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
  }

  // If no code, redirect to login
  return NextResponse.redirect(new URL("/auth/login", requestUrl.origin));
}
