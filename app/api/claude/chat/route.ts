/**
 * API Route: Claude Chat
 * Handles streaming chat interactions with Claude AI for BMAD workflows
 */

import { NextRequest, NextResponse } from "next/server";
import { createClaudeClient, sendMessageStream, loadBMADAgentPrompt } from "@/lib/services/claude.service";
import { logger } from "@/lib/logger";

export const runtime = "edge";

interface ChatRequest {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  agentType: "analyst" | "architect" | "pm";
  apiKey?: string; // User's own Anthropic API key
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const { messages, agentType, apiKey } = body;

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

    // Create Claude client with user's API key or fallback to app key
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
                encoder.encode(`data: ${JSON.stringify({ content: chunk, done: false })}\n\n`)
              );
            }
          );

          // Send final message
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ content: "", done: true })}\n\n`)
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
