/**
 * API Route: Generate Stage Summary
 * Creates a comprehensive summary and key takeaways from stage conversation
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
    stageNumber: string;
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

    const { id: projectId, stageNumber } = params;
    const stageNum = parseInt(stageNumber);

    if (isNaN(stageNum) || stageNum < 1 || stageNum > 3) {
      return NextResponse.json(
        { error: "Invalid stage number" },
        { status: 400 }
      );
    }

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

    // Get stage data
    const { data: stage, error: stageError } = await supabase
      .from("project_stages")
      .select("*")
      .eq("project_id", projectId)
      .eq("stage_number", stageNum)
      .single();

    type StageData = {
      responses?: { messages?: Array<{ role: string; content: string }> };
    } | null;
    const typedStage = stage as StageData;

    if (stageError || !typedStage) {
      return NextResponse.json({ error: "Stage not found" }, { status: 404 });
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

    const messages = typedStage.responses?.messages || [];
    const conversationText = messages
      .map((m: { role: string; content: string }) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n\n");

    const systemPrompt = `You are an expert at creating concise, actionable summaries of project planning conversations.

Your task is to analyze the conversation and create a structured summary with:
1. A brief overview (2-3 sentences)
2. Key takeaways (3-5 bullet points of the most important decisions/insights)
3. Action items or next steps (if applicable)

${summaryPrompts[stageNum as keyof typeof summaryPrompts]}

Keep the summary clear, professional, and focused on actionable insights.`;

    const userPrompt = `Please create a comprehensive summary for Stage ${stageNum}: ${stageTitles[stageNum as keyof typeof stageTitles]}

**Project:** ${typedProject.name}
${typedProject.description ? `**Description:** ${typedProject.description}\n` : ""}

**Conversation:**

${conversationText}

---

Generate a well-structured summary with overview, key takeaways, and next steps.`;

    // Call Claude to generate summary
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
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
    const { error: updateError } = await supabase
      .from("project_stages")
      .update({ summary: summaryContent } as never)
      .eq("project_id", projectId)
      .eq("stage_number", stageNum);

    if (updateError) {
      logger.error("Failed to save summary", { error: updateError, projectId, stageNum });
    }

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
