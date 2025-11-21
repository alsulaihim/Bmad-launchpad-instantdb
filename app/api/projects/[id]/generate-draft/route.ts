/**
 * API Route: Generate Draft Document
 * Creates a draft PRD after Stage 1 completion
 */

import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/instantdb/admin";
import { createClaudeClient } from "@/lib/services/claude.service";
import { decrypt } from "@/lib/encryption";
import { logger } from "@/lib/logger";

interface RouteContext {
  params: Promise<{
    id: string;
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

    const { id: projectId } = params;

    // Verify project ownership
    const projectQuery = await dbAdmin.query({
      projects: {
        $: {
          where: {
            id: projectId,
            "owner.id": userId
          }
        }
      }
    });

    const project = projectQuery.projects && projectQuery.projects.length > 0 ? projectQuery.projects[0] : null;

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get Stage 1 data
    const stageQuery = await dbAdmin.query({
      project_stages: {
        $: {
          where: {
            "project.id": projectId,
            stage_number: 1
          }
        }
      }
    });

    const stage1 = stageQuery.project_stages && stageQuery.project_stages.length > 0 ? stageQuery.project_stages[0] : null;

    if (!stage1 || !stage1.completed) {
      return NextResponse.json(
        { error: "Stage 1 must be completed first" },
        { status: 400 }
      );
    }

    // Get user's encrypted API key from profiles
    const profileQuery = await dbAdmin.query({
      profiles: {
        $: { where: { id: userId } }
      }
    });
    
    const profile = profileQuery.profiles && profileQuery.profiles.length > 0 ? profileQuery.profiles[0] : null;

    if (!profile || !profile.anthropic_api_key) {
      return NextResponse.json(
        { error: "Anthropic API key not found" },
        { status: 400 }
      );
    }

    const apiKey = decrypt(profile.anthropic_api_key);
    const client = createClaudeClient(apiKey);

    // Build draft document prompt
    const systemPrompt = `You are an expert Product Manager creating a draft requirements document.

Your task is to create a preliminary PRD based ONLY on the requirements and goals discussion from Stage 1.

The draft should include:
1. Executive Summary (brief overview)
2. Project Goals & Objectives
3. User Stories & Use Cases
4. Functional Requirements (detailed list)
5. Success Metrics
6. Placeholders for Architecture (TBD in Stage 2) and UI/UX (TBD in Stage 3)

Format in clear, professional Markdown. Mark sections that will be completed in later stages as "To Be Determined in Stage X".`;

    // Cast responses to expected type
    const responses = stage1.responses as { messages?: Array<{ role: string; content: string }> } || {};
    const messages = responses.messages || [];
    
    const conversationText = messages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n\n");

    const userPrompt = `Generate a draft PRD for the following project based on Stage 1 (Requirements & Goals):

**Project Name:** ${project.name}
${project.description ? `**Description:** ${project.description}\n` : ""}

**Stage 1 Conversation:**

${conversationText}

**Stage 1 Summary:**
${stage1.summary || "N/A"}

---

Create a comprehensive draft PRD. Note that Architecture (Stage 2) and UI/UX (Stage 3) sections should have placeholders marked as "TBD".`;

    // Call Claude to generate draft
    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20240620", // using known good model if previous was placeholder
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
      system: systemPrompt,
    });

    const draftContent =
      response.content[0].type === "text" ? response.content[0].text : "";

    logger.info("Draft PRD generated successfully", { projectId });

    return NextResponse.json({ draft: draftContent });
  } catch (error) {
    logger.error("Error generating draft", { error });
    return NextResponse.json(
      { error: "Failed to generate draft" },
      { status: 500 }
    );
  }
}
