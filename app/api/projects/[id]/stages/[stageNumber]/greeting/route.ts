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

Generate a warm, professional greeting that:
1. Introduces yourself as the BMAD ${agentType.charAt(0).toUpperCase() + agentType.slice(1)} agent
2. Shows you've read and understood the project context
3. Provides 2-3 initial observations or thoughts about the project
4. Asks a thoughtful, specific opening question tailored to this particular project

Keep it conversational, engaging, and show genuine interest in helping with this specific project. The greeting should be 3-4 paragraphs maximum.`;

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

    // Load Stage 1 summary if we're in Stage 2 or 3
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

      if (stage1?.completed && stage1?.summary) {
        const summary = stage1.summary.split("\n\n").slice(0, 2).join("\n\n");
        context += `**Previous Stage - Requirements & Goals:**\n${summary.substring(0, 400)}...\n`;
      }
    }

    // Load Stage 2 summary if we're in Stage 3
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

      if (stage2?.completed && stage2?.summary) {
        const summary = stage2.summary.split("\n\n").slice(0, 2).join("\n\n");
        context += `\n**Previous Stage - Tech Stack & Architecture:**\n${summary.substring(0, 400)}...\n`;
      }
    }

    return context || null;
  } catch (error) {
    logger.error("Error loading previous stages context", { error });
    return null;
  }
}
