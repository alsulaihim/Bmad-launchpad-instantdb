/**
 * API Route: Generate PRD
 * Compiles all 3 stages into a comprehensive Product Requirements Document using Claude
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

interface StageData {
  stage_number: number;
  stage_name: string;
  summary: string;
  responses: {
    messages: Array<{ role: string; content: string }>;
  };
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
    const body = await req.json();
    const { stages } = body as { stages: StageData[] };

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    type ProjectData = { name: string; description?: string } | null;
    const typedProject = project as ProjectData;

    if (projectError || !typedProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
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

    // Extract conversation content from all stages
    const stage1 = stages.find((s) => s.stage_number === 1);
    const stage2 = stages.find((s) => s.stage_number === 2);
    const stage3 = stages.find((s) => s.stage_number === 3);

    // Build comprehensive prompt for PRD generation
    const systemPrompt = `You are an expert Product Manager specializing in creating comprehensive Product Requirements Documents (PRDs).

Your task is to analyze the conversation history from a 3-stage BMAD (Breakthrough Method for Agile AI-Driven Development) workflow and generate a professional, detailed PRD.

The PRD should include:
1. Executive Summary
2. Project Goals & Objectives
3. User Stories & Use Cases
4. Functional Requirements
5. Technical Architecture & Stack
6. UI/UX Specifications
7. Success Metrics
8. Timeline & Milestones
9. Risks & Mitigation

Format the PRD in clear, professional Markdown. Be specific and actionable.`;

    const userPrompt = `Generate a comprehensive Product Requirements Document for the following project:

**Project Name:** ${typedProject.name}
**Description:** ${typedProject.description || "N/A"}

---

## Stage 1: Brainstorming & Requirements

${stage1?.responses.messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n")}

---

## Stage 2: Tech Stack & Architecture

${stage2?.responses.messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n")}

---

## Stage 3: UI/UX Design

${stage3?.responses.messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n")}

---

Based on these three comprehensive discussions, create a professional PRD that captures all requirements, technical decisions, and design specifications.`;

    // Call Claude to generate PRD
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
      system: systemPrompt,
    });

    const prdContent =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Save PRD to database
    const { error: prdError } = await supabase.from("prd_documents").insert({
      project_id: projectId,
      content: prdContent,
      generated_by: "claude-sonnet-4",
    } as never);

    if (prdError) {
      logger.error("Failed to save PRD", { error: prdError, projectId });
    }

    // Mark project as completed
    await supabase
      .from("projects")
      .update({ status: "completed" } as never)
      .eq("id", projectId);

    logger.info("PRD generated successfully", { projectId });

    return NextResponse.json({ prd: prdContent });
  } catch (error) {
    logger.error("Error generating PRD", { error });
    return NextResponse.json(
      { error: "Failed to generate PRD" },
      { status: 500 }
    );
  }
}
