/**
 * API Route: Generate Stage Summary
 * Creates a comprehensive summary and key takeaways from stage conversation
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

    // Verify project ownership and get stage
    const projectQuery = await dbAdmin.query({
      projects: {
        $: {
          where: {
            id: projectId,
            "owner.id": userId
          }
        }
      },
      project_stages: {
        $: {
          where: {
            "project.id": projectId,
            stage_number: stageNum
          }
        }
      },
      profiles: {
        $: { where: { id: userId } }
      }
    });

    const project = projectQuery.projects && projectQuery.projects.length > 0 ? projectQuery.projects[0] : null;
    const stage = projectQuery.project_stages && projectQuery.project_stages.length > 0 ? projectQuery.project_stages[0] : null;
    const profile = projectQuery.profiles && projectQuery.profiles.length > 0 ? projectQuery.profiles[0] : null;

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (!stage) {
      return NextResponse.json({ error: "Stage not found" }, { status: 404 });
    }
    if (!profile || !profile.anthropic_api_key) {
      return NextResponse.json(
        { error: "Anthropic API key not found" },
        { status: 400 }
      );
    }

    const apiKey = decrypt(profile.anthropic_api_key);
    const client = createClaudeClient(apiKey);

    // Map stage numbers to agent types
    const AGENT_TYPES = {
      1: "analyst" as const,
      2: "architect" as const,
      3: "designer" as const,
    };

    const STAGE_NAMES = {
      1: "Brainstorming & Requirements",
      2: "Technical Architecture",
      3: "UI/UX Design",
    };

    const agentType = AGENT_TYPES[stageNum as keyof typeof AGENT_TYPES];

    // Load the BMAD agent system prompt
    const agentSystemPrompt = await loadBMADAgentPrompt(agentType);

    const responses = stage.responses as { messages?: Array<{ role: string; content: string }> } || {};
    const messages = responses.messages || [];

    const conversationText = messages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n\n");

    // Create a BMAD-aligned summary prompt that instructs the agent to create a handoff document
    const summarySystemPrompt = `${agentSystemPrompt}

---

IMPORTANT TASK: You have just completed a comprehensive ${STAGE_NAMES[stageNum as keyof typeof STAGE_NAMES]} session with the user.

Your task is now to create a **handoff summary** that will be given to the ${stageNum === 1 ? "Architect" : stageNum === 2 ? "Designer" : "Development Team"} in the next stage.

This summary should be:
1. **Comprehensive yet concise** - Capture all critical decisions and insights
2. **Actionable** - Clear enough that the next agent knows exactly what was decided
3. **Structured** - Use clear headings and bullet points
4. **Context-rich** - Include the "why" behind decisions, not just the "what"

Format the summary with these sections:
## Overview
A 2-3 sentence executive summary of this stage

## Key Decisions & Insights
Bullet points of the most important conclusions, decisions, or requirements established

## ${stageNum === 1 ? "Requirements for Architecture" : stageNum === 2 ? "Technical Context for Design" : "Design Specifications"}
Specific details that the next stage needs to know

## Considerations & Constraints
Any limitations, concerns, or special requirements to keep in mind

${stageNum === 1 ? "## Success Criteria\nHow we'll measure if this project achieves its goals" : ""}`;

    const userPrompt = `Please create a comprehensive handoff summary for the ${STAGE_NAMES[stageNum as keyof typeof STAGE_NAMES]} stage.

**Project:** ${project.name}
${project.description ? `**Description:** ${project.description}\n` : ""}

**Conversation:**

${conversationText}

---

Generate a well-structured summary following the format specified in your instructions. This summary will be used by the ${stageNum === 1 ? "Architect" : stageNum === 2 ? "Designer" : "Development Team"} to understand what was decided in this stage.`;

    // Call Claude to generate summary using BMAD agent
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
      system: summarySystemPrompt,
    });

    const summaryContent =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Update stage with summary
    await dbAdmin.transact([
      dbAdmin.tx.project_stages[stage.id].update({
        summary: summaryContent,
        updated_at: new Date().toISOString()
      })
    ]);

    logger.info("Summary generated successfully", { projectId, stageNum });

    return NextResponse.json({ summary: summaryContent });
  } catch (error) {
    logger.error("Error generating summary", { error });
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
