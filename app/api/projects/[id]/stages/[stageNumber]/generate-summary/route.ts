/**
 * API Route: Generate Stage Summary
 * Creates a comprehensive summary and key takeaways from stage conversation
 */

import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/instantdb/admin";
import { createClaudeClient } from "@/lib/services/claude.service";
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

    // Stage-specific summary prompts
    const stageTitles = {
      1: "Requirements & Goals",
      2: "Tech Stack & Architecture",
      3: "UI/UX Design",
    };

    const summaryPrompts = {
      1: `You are summarizing a brainstorming and requirements gathering session. Focus on:
- Core project goals and objectives
- Key features and functionalities
- Target users and use cases
- Business requirements and constraints
- Success criteria`,
      2: `You are summarizing a technical architecture discussion. Focus on:
- Chosen tech stack and frameworks
- System architecture and design patterns
- Infrastructure and deployment strategy
- Data models and database design
- Technical constraints and considerations`,
      3: `You are summarizing a UI/UX design discussion. Focus on:
- User interface design patterns
- User experience flow and navigation
- Visual design principles and components
- Accessibility and responsiveness
- Design system and branding`,
    };

    const responses = stage.responses as { messages?: Array<{ role: string; content: string }> } || {};
    const messages = responses.messages || [];
    
    const conversationText = messages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n\n");

    const systemPrompt = `You are an expert at creating concise, actionable summaries of project planning conversations.

Your task is to analyze the conversation and create a structured summary with:
1. A brief overview (2-3 sentences)
2. Key takeaways (3-5 bullet points of the most important decisions/insights)
3. Action items or next steps (if applicable)

${summaryPrompts[stageNum as keyof typeof summaryPrompts]}

Keep the summary clear, professional, and focused on actionable insights.`;

    const userPrompt = `Please create a comprehensive summary for Stage ${stageNum}: ${stageTitles[stageNum as keyof typeof stageTitles]}

**Project:** ${project.name}
${project.description ? `**Description:** ${project.description}\n` : ""}

**Conversation:**

${conversationText}

---

Generate a well-structured summary with overview, key takeaways, and next steps.`;

    // Call Claude to generate summary
    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
      system: systemPrompt,
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
