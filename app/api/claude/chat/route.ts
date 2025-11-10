/**
 * API Route: Claude Chat
 * Handles streaming chat interactions with Claude AI for BMAD workflows
 * Retrieves user's encrypted API key from database
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/types/database.types";
import {
  createClaudeClient,
  sendMessageStream,
  loadBMADAgentPrompt,
} from "@/lib/services/claude.service";
import { decrypt } from "@/lib/encryption";
import { logger } from "@/lib/logger";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface ChatRequest {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  agentType: "analyst" | "architect" | "pm";
}

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

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's encrypted API key
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("anthropic_api_key")
      .eq("id", user.id)
      .single();

    type ProfileData = { anthropic_api_key: string | null } | null;
    const typedProfile = profile as ProfileData;

    if (profileError || !typedProfile || !typedProfile.anthropic_api_key) {
      return NextResponse.json(
        {
          error:
            "Anthropic API key not found. Please connect your account in settings.",
        },
        { status: 400 }
      );
    }

    // Decrypt the API key
    const apiKey = decrypt(typedProfile.anthropic_api_key);

    const body: ChatRequest = await req.json();
    const { messages, agentType } = body;

    // Validate request
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    if (!agentType || !["analyst", "architect", "pm"].includes(agentType)) {
      return NextResponse.json(
        { error: "Valid agent type is required (analyst, architect, pm)" },
        { status: 400 }
      );
    }

    // Create Claude client with user's decrypted API key
    const client = createClaudeClient(apiKey);

    // Load the appropriate BMAD agent system prompt
    const systemPrompt = await loadBMADAgentPrompt(agentType);

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          await sendMessageStream(
            client,
            messages,
            systemPrompt,
            (chunk: string) => {
              // Send each chunk as Server-Sent Event
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ content: chunk, done: false })}\n\n`
                )
              );
            }
          );

          // Send final message
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ content: "", done: true })}\n\n`
            )
          );

          controller.close();
        } catch (error) {
          logger.error("Error in Claude streaming", { error, agentType });
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "Failed to generate response" })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    logger.error("Error in chat API", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
