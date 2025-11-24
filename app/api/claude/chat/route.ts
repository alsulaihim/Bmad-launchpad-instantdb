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
  projectId?: string;
  stageNumber?: number;
}

export async function POST(req: NextRequest) {
  try {
    // Get userId from request body (sent from client)
    const body: ChatRequest & { userId?: string } = await req.json();
    const { messages, agentType, userId, projectId, stageNumber } = body;

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
    let systemPrompt = await loadBMADAgentPrompt(agentType);

    // Add previous stage context to system prompt if we're in stage 2 or 3
    if (projectId && stageNumber && stageNumber > 1) {
      const previousContext = await getPreviousStagesContext(projectId, stageNumber);
      if (previousContext) {
        systemPrompt += `\n\n---\n\n## CONTEXT FROM PREVIOUS STAGES\n\nThe user has already completed previous stage(s) of this project. Below you'll find both a summary and the full conversation history from earlier stages.\n\n${previousContext}\n\n### How to Use This Context:\n\n1. **Reference the Summary** for a quick overview of key decisions and requirements\n2. **Search the Full Conversation** when you need specific details, examples, or the reasoning behind decisions\n3. **DO NOT ask questions** that were already answered in previous stages\n4. **DO reference and build upon** what was discussed before\n5. **Acknowledge the previous work** - show you've read and understood the context\n\nIMPORTANT: The user should NOT have to repeat themselves. All the information from previous stages is available above. Use it throughout our conversation.`;
      }
    }

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

async function getPreviousStagesContext(
  projectId: string,
  currentStage: number
): Promise<string | null> {
  try {
    let context = "";

    // Load Stage 1 if we're in Stage 2 or 3
    if (currentStage >= 2) {
      const stage1Query = await dbAdmin.query({
        project_stages: {
          $: {
            where: {
              "project.id": projectId,
              stage_number: 1
            }
          }
        }
      });

      const stage1 = stage1Query.project_stages && stage1Query.project_stages.length > 0 ? stage1Query.project_stages[0] : null;

      if (stage1?.completed) {
        context += `### Stage 1: Requirements & Goals (Analyst)\n\n`;

        // Include the summary first for quick reference
        if (stage1.summary) {
          context += `**Summary:**\n${stage1.summary}\n\n`;
        }

        // Include the full conversation for complete context
        if (stage1.responses?.messages && Array.isArray(stage1.responses.messages)) {
          context += `**Full Conversation:**\n\n`;
          const messages = stage1.responses.messages as Array<{ role: string; content: string }>;
          for (const msg of messages) {
            context += `**${msg.role.toUpperCase()}:** ${msg.content}\n\n`;
          }
          context += `---\n\n`;
        }
      }
    }

    // Load Stage 2 if we're in Stage 3
    if (currentStage === 3) {
      const stage2Query = await dbAdmin.query({
        project_stages: {
          $: {
            where: {
              "project.id": projectId,
              stage_number: 2
            }
          }
        }
      });

      const stage2 = stage2Query.project_stages && stage2Query.project_stages.length > 0 ? stage2Query.project_stages[0] : null;

      if (stage2?.completed) {
        context += `### Stage 2: Tech Stack & Architecture (Architect)\n\n`;

        // Include the summary first for quick reference
        if (stage2.summary) {
          context += `**Summary:**\n${stage2.summary}\n\n`;
        }

        // Include the full conversation for complete context
        if (stage2.responses?.messages && Array.isArray(stage2.responses.messages)) {
          context += `**Full Conversation:**\n\n`;
          const messages = stage2.responses.messages as Array<{ role: string; content: string }>;
          for (const msg of messages) {
            context += `**${msg.role.toUpperCase()}:** ${msg.content}\n\n`;
          }
          context += `---\n\n`;
        }
      }
    }

    return context || null;
  } catch (error) {
    logger.error("Error loading previous stages context", { error });
    return null;
  }
}
