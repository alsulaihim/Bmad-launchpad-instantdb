/**
 * API Route: User API Key Management
 * Save and retrieve encrypted Anthropic API keys
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/types/database.types";
import { encrypt, decrypt } from "@/lib/encryption";
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
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

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

    // Update user profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        anthropic_api_key: encryptedKey,
        updated_at: new Date().toISOString(),
      })
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
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("anthropic_api_key")
      .eq("id", user.id)
      .single();

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
      hasApiKey: !!profile?.anthropic_api_key,
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
