/**
 * Auth Callback Route
 * Handles magic link callbacks from Supabase
 *
 * IMPORTANT: Magic links with PKCE require the code_verifier stored in the
 * browser that requested the link. Cross-browser magic links are not supported
 * with PKCE enabled.
 */

import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const error_description = requestUrl.searchParams.get("error_description");

  if (error_description) {
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(error_description)}`, requestUrl.origin)
    );
  }

  if (!code) {
    return NextResponse.redirect(new URL("/auth/login?error=no_code", requestUrl.origin));
  }

  try {
    const cookieStore = await cookies();

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
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      // PKCE error means cross-browser usage
      if (error.message?.includes('code verifier')) {
        return NextResponse.redirect(
          new URL("/auth/login?error=magic_link_cross_browser", requestUrl.origin)
        );
      }

      return NextResponse.redirect(
        new URL(`/auth/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
      );
    }

    if (data?.session) {
      return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
    }

  } catch (err) {
    console.error("Callback exception:", err);
    return NextResponse.redirect(new URL("/auth/login?error=exception", requestUrl.origin));
  }

  return NextResponse.redirect(new URL("/auth/login?error=unknown", requestUrl.origin));
}