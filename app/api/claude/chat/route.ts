/**
 * API Route: Claude Chat
 * Handles streaming chat interactions with Claude AI for BMAD workflows
 * Retrieves user's encrypted API key from database
 */

import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/instantdb/admin";
import {
  createClaudeClient,
  sendMessageStream,
} from "@/lib/services/claude.service";
import { loadBMADAgentPrompt } from "@/lib/bmad-agents/loader";
import { decrypt } from "@/lib/encryption";
import { logger } from "@/lib/logger";

interface ChatRequest {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  agentType: "analyst" | "architect" | "designer" | "pm";
}

export async function POST(req: NextRequest) {
  try {
    // Get userId from request body (sent from client)
    const body: ChatRequest & { userId?: string } = await req.json();
    const { messages, agentType, userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Get user's encrypted API key
    const queryResult = await dbAdmin.query({
      profiles: {
        $: { where: { id: userId } }
      }
    });

    const profile = queryResult.profiles && queryResult.profiles.length > 0 ? queryResult.profiles[0] : null;

    if (!profile || !profile.anthropic_api_key) {
      return NextResponse.json(
        {
          error:
            "Anthropic API key not found. Please connect your account in settings.",
        },
        { status: 400 }
      );
    }

    // Decrypt the API key
    const apiKey = decrypt(profile.anthropic_api_key);

    // Validate request
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    if (!agentType || !["analyst", "architect", "designer", "pm"].includes(agentType)) {
      return NextResponse.json(
        { error: "Valid agent type is required (analyst, architect, designer, pm)" },
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
