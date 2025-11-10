/**
 * Auth Callback Route
 * Handles OAuth and magic link callbacks from Supabase
 */

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // Create a Supabase client with cookie support for server-side auth
    const cookieStore = await cookies();

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          cookie: cookieStore.toString(),
        },
      },
    });

    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth callback error:", error);
      // Redirect to login with error
      return NextResponse.redirect(new URL("/auth/login?error=auth_error", requestUrl.origin));
    }

    if (data.session) {
      // Create response with redirect
      const response = NextResponse.redirect(new URL("/dashboard", requestUrl.origin));

      // Set the session cookies
      const { access_token, refresh_token } = data.session;

      // Set access token cookie
      response.cookies.set({
        name: `sb-${supabaseUrl.split("//")[1].split(".")[0]}-auth-token`,
        value: JSON.stringify(data.session),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });

      return response;
    }
  }

  // If no code or authentication failed, redirect to login
  return NextResponse.redirect(new URL("/auth/login", requestUrl.origin));
}
