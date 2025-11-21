/**
 * API Route: User API Key Management
 * Save and retrieve encrypted Anthropic API keys
 */

import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/instantdb/admin";
import { encrypt } from "@/lib/encryption";
import { logger } from "@/lib/logger";

/**
 * POST /api/user/api-key
 * Save user's Anthropic API key (encrypted)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiKey, userId } = body;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

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

    // Encrypt the API key and return it (client will save to InstantDB)
    const encryptedKey = encrypt(apiKey);

    logger.info("API key encrypted successfully", { userId });

    return NextResponse.json({
      success: true,
      encryptedKey,
      message: "API key encrypted successfully",
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
 * Expects userId as query parameter
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const queryResult = await dbAdmin.query({
      profiles: {
        $: { where: { id: userId } }
      }
    });

    const profile = queryResult.profiles && queryResult.profiles.length > 0 ? queryResult.profiles[0] : null;

    // If profile doesn't exist, create it
    if (!profile) {
      try {
        await dbAdmin.transact([
          dbAdmin.tx.profiles[userId].update({
            email: "",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        ]);

        // Profile created, no API key
        return NextResponse.json({
          hasApiKey: false,
        });
      } catch (createError: any) {
        logger.error("Failed to create profile in GET", { error: createError, userId });
        return NextResponse.json({
          error: "Failed to create profile",
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      hasApiKey: !!profile.anthropic_api_key,
    });
  } catch (error) {
    logger.error("Error in get API key route", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
