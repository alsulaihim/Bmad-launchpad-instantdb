/**
 * API Route: Generate PRD
 * Compiles all 3 stages into a comprehensive Product Requirements Document using Claude
 */

import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/instantdb/admin";
import { createClaudeClient } from "@/lib/services/claude.service";
import { decrypt } from "@/lib/encryption";
import { logger } from "@/lib/logger";
import { id } from "@instantdb/admin";

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
    const body = await req.json();
    const { userId, stages } = body as { userId: string; stages: StageData[] };

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

    // Check if PRD already exists
    const prdQuery = await dbAdmin.query({
      prd_documents: {
        $: {
          where: { "project.id": projectId }
        }
      }
    });
    
    // Assuming we want the latest if multiple exist (though usually 1-1)
    const existingPrd = prdQuery.prd_documents && prdQuery.prd_documents.length > 0 ? prdQuery.prd_documents[0] : null;

    if (existingPrd && existingPrd.content) {
      // PRD already exists, return it without regenerating
      logger.info("PRD already exists, returning cached version", { projectId });
      return NextResponse.json({ prd: existingPrd.content });
    }

    // Get user's encrypted API key
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

**Project Name:** ${project.name}
**Description:** ${project.description || "N/A"}

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
      model: "claude-3-5-sonnet-20240620",
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

    // Save PRD to database and update project status
    const prdId = id();
    const now = new Date().toISOString();

    await dbAdmin.transact([
      // Create PRD
      dbAdmin.tx.prd_documents[prdId].update({
        content: prdContent,
        format: "markdown",
        version: 1,
        created_at: now,
        updated_at: now,
      }).link({ project: projectId }),
      
      // Update Project Status
      dbAdmin.tx.projects[projectId].update({
        status: "completed",
        updated_at: now
      })
    ]);

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
