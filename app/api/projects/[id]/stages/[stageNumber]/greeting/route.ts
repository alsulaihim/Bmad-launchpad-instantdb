/**
 * API Route: Generate Dynamic Agent Greeting
 * Creates an AI-powered, context-aware greeting based on project details
 */

import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/instantdb/admin";
import { createClaudeClient } from "@/lib/services/claude.service";
import { loadBMADAgentPrompt } from "@/lib/bmad-agents/loader";
import { decrypt } from "@/lib/encryption";
import { logger } from "@/lib/logger";

interface RouteContext {
  params: Promise<{
    id: string;
    stageNumber: string;
  }>;
}

const STAGE_NAMES = {
  1: "Brainstorming & Requirements",
  2: "Tech Stack & Architecture",
  3: "UI/UX Design",
};

const AGENT_TYPES = {
  1: "analyst" as const,
  2: "architect" as const,
  3: "designer" as const,
};

export async function POST(req: NextRequest, context: RouteContext) {
  const params = await context.params;
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const { id: projectId, stageNumber } = params;
    const stageNum = parseInt(stageNumber);

    if (isNaN(stageNum) || stageNum < 1 || stageNum > 3) {
      return NextResponse.json(
        { error: "Invalid stage number" },
        { status: 400 }
      );
    }

    // Get project and user's API key
    const query = await dbAdmin.query({
      projects: {
        $: {
          where: {
            id: projectId,
            "owner.id": userId
          }
        }
      },
      profiles: {
        $: { where: { id: userId } }
      }
    });

    const project = query.projects && query.projects.length > 0 ? query.projects[0] : null;
    const profile = query.profiles && query.profiles.length > 0 ? query.profiles[0] : null;

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!profile || !profile.anthropic_api_key) {
      return NextResponse.json(
        { error: "Anthropic API key not found" },
        { status: 400 }
      );
    }

    const apiKey = decrypt(profile.anthropic_api_key);
    const client = createClaudeClient(apiKey);
    const agentType = AGENT_TYPES[stageNum as keyof typeof AGENT_TYPES];
    const systemPrompt = await loadBMADAgentPrompt(agentType);

    // Build context for greeting generation
    let contextInfo = `**Project Name:** ${project.name}\n`;
    if (project.description) {
      contextInfo += `**Project Description:** ${project.description}\n`;
    }

    // Add previous stage context for stages 2 and 3
    if (stageNum > 1) {
      const previousStages = await getPreviousStagesContext(projectId, stageNum);
      if (previousStages) {
        contextInfo += `\n${previousStages}`;
      }
    }

    const greetingPrompt = `You are starting a ${STAGE_NAMES[stageNum as keyof typeof STAGE_NAMES]} session with a user.

${contextInfo}

${stageNum > 1 ? `IMPORTANT: You have access to the complete summary from the previous stage(s) above. This contains all the decisions, requirements, and context from earlier conversations. Use this information throughout our conversation so the user doesn't have to repeat themselves.\n\n` : ""}Generate a warm, professional greeting that:
1. Introduces yourself as the ${agentType.charAt(0).toUpperCase() + agentType.slice(1)} agent
2. Shows you've read and understood the project context${stageNum > 1 ? " AND the previous stage summary" : ""}
3. Provides 2-3 initial observations or thoughts about the project${stageNum > 1 ? " based on what was discussed in previous stages" : ""}
4. Asks a thoughtful, specific opening question tailored to this particular project

Keep it conversational, engaging, and show genuine interest in helping with this specific project. The greeting should be 3-4 paragraphs maximum.

${stageNum > 1 ? "Remember: You have the full context from previous stages, so avoid asking questions that were already answered." : ""}`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: greetingPrompt,
        },
      ],
    });

    const greeting =
      response.content[0].type === "text" ? response.content[0].text : "";

    logger.info("Dynamic greeting generated", { projectId, stageNum });

    return NextResponse.json({ greeting });
  } catch (error) {
    logger.error("Error generating dynamic greeting", { error });
    return NextResponse.json(
      { error: "Failed to generate greeting" },
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
        context += `**Previous Stage - Requirements & Goals (Analyst):**\n\n`;

        // Include summary for greeting generation
        if (stage1.summary) {
          context += `${stage1.summary}\n\n`;
        }

        // Also mention that full conversation is available
        if (stage1.responses?.messages && Array.isArray(stage1.responses.messages)) {
          const messageCount = stage1.responses.messages.length;
          context += `_(Full conversation with ${messageCount} messages is available for reference)_\n\n`;
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
        context += `**Previous Stage - Tech Stack & Architecture (Architect):**\n\n`;

        // Include summary for greeting generation
        if (stage2.summary) {
          context += `${stage2.summary}\n\n`;
        }

        // Also mention that full conversation is available
        if (stage2.responses?.messages && Array.isArray(stage2.responses.messages)) {
          const messageCount = stage2.responses.messages.length;
          context += `_(Full conversation with ${messageCount} messages is available for reference)_\n\n`;
        }
      }
    }

    return context || null;
  } catch (error) {
    logger.error("Error loading previous stages context", { error });
    return null;
  }
}
