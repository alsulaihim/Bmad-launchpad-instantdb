/**
 * API Route: User API Key Management
 * Save and retrieve encrypted Anthropic API keys
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/types/database.types";
import { encrypt } from "@/lib/encryption";
import { logger } from "@/lib/logger";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/user/api-key
 * Save user's Anthropic API key (encrypted)
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");

    // Create admin client with service role key (bypasses RLS)
    const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // Verify the user's identity using their token
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { apiKey } = body;

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }

    // Validate format
    if (!apiKey.startsWith("sk-ant-api03-")) {
      return NextResponse.json(
        { error: "Invalid API key format" },
        { status: 400 }
      );
    }

    // Encrypt the API key
    const encryptedKey = encrypt(apiKey);

    // First, ensure profile exists (using admin client)
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!existingProfile) {
      // Create profile if it doesn't exist
      // Ensure we have an email
      const email = user.email || user.user_metadata?.email || `${user.id}@placeholder.local`;

      const { error: createError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: user.id,
          email: email,
          full_name: user.user_metadata?.full_name || null,
          anthropic_api_key: encryptedKey,
        } as never);

      if (createError) {
        logger.error("Failed to create profile with API key in POST", {
          error: createError,
          errorMessage: createError.message,
          errorDetails: createError.details,
          errorHint: createError.hint,
          userId: user.id,
          email: email,
        });
        return NextResponse.json(
          {
            error: "Failed to save API key",
            details: createError.message,
            hint: createError.hint,
          },
          { status: 500 }
        );
      }
    } else {
      // Update existing profile
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          anthropic_api_key: encryptedKey,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", user.id);

      if (updateError) {
        logger.error("Failed to save API key", {
          error: updateError,
          userId: user.id,
        });
        return NextResponse.json(
          { error: "Failed to save API key" },
          { status: 500 }
        );
      }
    }

    logger.info("API key saved successfully", { userId: user.id });

    return NextResponse.json({
      success: true,
      message: "API key saved successfully",
    });
  } catch (error) {
    logger.error("Error in save API key route", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user/api-key
 * Check if user has an API key configured
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");

    // Create admin client with service role key (bypasses RLS)
    const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // Verify the user's identity using their token
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("anthropic_api_key")
      .eq("id", user.id)
      .maybeSingle();

    type ProfileData = { anthropic_api_key: string | null } | null;
    const typedProfile = profile as ProfileData;

    // If profile doesn't exist, create it
    if (!profile) {
      // Ensure we have an email
      const email = user.email || user.user_metadata?.email || `${user.id}@placeholder.local`;

      const { error: createError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: user.id,
          email: email,
          full_name: user.user_metadata?.full_name || null,
        } as never);

      if (createError) {
        logger.error("Failed to create profile in GET", {
          error: createError,
          errorMessage: createError.message,
          errorDetails: createError.details,
          errorHint: createError.hint,
          userId: user.id,
          email: email,
        });

        // Return error details for debugging
        return NextResponse.json({
          error: "Failed to create profile",
          details: createError.message,
          hint: createError.hint,
        }, { status: 500 });
      }

      // Profile was just created, so no API key yet
      return NextResponse.json({
        hasApiKey: false,
      });
    }

    if (error) {
      logger.error("Failed to fetch API key status", {
        error,
        userId: user.id,
      });
      return NextResponse.json(
        { error: "Failed to check API key status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      hasApiKey: !!typedProfile?.anthropic_api_key,
      // Never return the actual key
    });
  } catch (error) {
    logger.error("Error in get API key route", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
