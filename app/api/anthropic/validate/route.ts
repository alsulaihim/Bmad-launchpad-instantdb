/**
 * API Route: Validate Anthropic API Key
 * Tests if a user's API key is valid
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
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
        { error: "Invalid API key format. Anthropic keys start with 'sk-ant-api03-'" },
        { status: 400 }
      );
    }

    // Test the API key with a minimal request
    try {
      const client = new Anthropic({ apiKey });

      // Make a minimal API call to validate the key
      await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 10,
        messages: [{ role: "user", content: "Hi" }],
      });

      logger.info("API key validated successfully");

      return NextResponse.json({
        valid: true,
        message: "API key is valid",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const errorStatus = (error as { status?: number }).status;
      logger.error("API key validation failed", { error: errorMessage });

      if (errorStatus === 401) {
        return NextResponse.json(
          { error: "Invalid API key. Please check your key and try again." },
          { status: 401 }
        );
      }

      if (errorStatus === 429) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again in a moment." },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: "Failed to validate API key. Please try again." },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Error in validate API route", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
