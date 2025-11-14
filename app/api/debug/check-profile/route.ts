/**
 * Debug API: Check Profile Status
 * Helps diagnose profile issues
 *
 * Usage: GET /api/debug/check-profile
 * Requires: Authorization header with user token
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/types/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // Get user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({
        error: "Authentication failed",
        details: authError,
      }, { status: 401 });
    }

    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    // Try to create profile if it doesn't exist
    let profileCreated = false;
    let createError = null;

    if (!profile) {
      const { error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || null,
        } as never);

      profileCreated = !insertError;
      createError = insertError;
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata,
      },
      profile: {
        exists: !!profile,
        data: profile,
        error: profileError?.message || null,
      },
      profileCreation: {
        attempted: !profile,
        success: profileCreated,
        error: createError?.message || null,
        errorDetails: createError,
      },
      environment: {
        supabaseUrlSet: !!supabaseUrl,
        serviceKeySet: !!supabaseServiceKey,
      }
    });

  } catch (error) {
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}