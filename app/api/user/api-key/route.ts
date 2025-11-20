/**
 * API Route: User API Key Management
 * Save and retrieve encrypted Anthropic API keys
 */

import { NextRequest, NextResponse } from "next/server";
import { dbAdmin, verifyAuthToken } from "@/lib/instantdb/admin";
import { encrypt } from "@/lib/encryption";
import { logger } from "@/lib/logger";

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
    const user = await verifyAuthToken(token);

    if (!user) {
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

    // Update profile (create if needed via upsert semantics in transact)
    // InstantDB update creates if not exists (upsert) for that ID? 
    // Actually update requires existence if we use `update`. `merge` or `set`? 
    // `update` in InstantDB usually merges. If entity doesn't exist, it creates it (with just those fields).
    
    try {
      await dbAdmin.transact([
        dbAdmin.tx.profiles[user.id].update({
          anthropic_api_key: encryptedKey,
          email: user.email || "", // Ensure email is there if creating
          updated_at: new Date().toISOString(),
        })
      ]);
    } catch (error: any) {
      logger.error("Failed to save API key", { error, userId: user.id });
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
    const user = await verifyAuthToken(token);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const queryResult = await dbAdmin.query({
      profiles: {
        $: { where: { id: user.id } }
      }
    });

    const profile = queryResult.profiles && queryResult.profiles.length > 0 ? queryResult.profiles[0] : null;

    // If profile doesn't exist, create it (placeholder)
    if (!profile) {
      try {
        await dbAdmin.transact([
          dbAdmin.tx.profiles[user.id].update({
            email: user.email || "",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        ]);
        
        // Profile created, no API key
        return NextResponse.json({
          hasApiKey: false,
        });
      } catch (createError: any) {
        logger.error("Failed to create profile in GET", { error: createError, userId: user.id });
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
