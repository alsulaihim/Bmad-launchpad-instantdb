/**
 * API Route: Generate Draft Document
 * Creates a draft PRD after Stage 1 completion
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/types/database.types";
import { createClaudeClient } from "@/lib/services/claude.service";
import { decrypt } from "@/lib/encryption";
import { logger } from "@/lib/logger";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  const params = await context.params;
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

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = params;

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    type ProjectData = { name: string; description: string } | null;
    const typedProject = project as ProjectData;

    if (projectError || !typedProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get Stage 1 data
    const { data: stage1, error: stage1Error } = await supabase
      .from("project_stages")
      .select("*")
      .eq("project_id", projectId)
      .eq("stage_number", 1)
      .single();

    type StageData = { completed: boolean; summary?: string; responses?: { messages?: Array<{ role: string; content: string }> } } | null;
    const typedStage1 = stage1 as StageData;

    if (stage1Error || !typedStage1 || !typedStage1.completed) {
      return NextResponse.json(
        { error: "Stage 1 must be completed first" },
        { status: 400 }
      );
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
        { error: "Anthropic API key not found" },
        { status: 400 }
      );
    }

    const apiKey = decrypt(typedProfile.anthropic_api_key);
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

    const messages = typedStage1.responses?.messages || [];
    const conversationText = messages
      .map((m: { role: string; content: string }) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n\n");

    const userPrompt = `Generate a draft PRD for the following project based on Stage 1 (Requirements & Goals):

**Project Name:** ${typedProject.name}
${typedProject.description ? `**Description:** ${typedProject.description}\n` : ""}

**Stage 1 Conversation:**

${conversationText}

**Stage 1 Summary:**
${typedStage1.summary || "N/A"}

---

Create a comprehensive draft PRD. Note that Architecture (Stage 2) and UI/UX (Stage 3) sections should have placeholders marked as "TBD".`;

    // Call Claude to generate draft
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
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
