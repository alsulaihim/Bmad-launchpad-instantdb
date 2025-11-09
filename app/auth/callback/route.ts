/**
 * Auth Callback Route
 * Handles OAuth and magic link callbacks from Supabase
 */

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    await supabase.auth.exchangeCodeForSession(code);
  }

  // Redirect to dashboard after successful authentication
  return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
}
