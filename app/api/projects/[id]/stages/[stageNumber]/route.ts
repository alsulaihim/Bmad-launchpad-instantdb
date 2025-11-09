/**
 * API Route: Project Stages
 * Handles operations for individual project stages
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/types/database.types";
import { logger } from "@/lib/logger";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface RouteParams {
  params: {
    id: string;
    stageNumber: string;
  };
}

/**
 * GET /api/projects/[id]/stages/[stageNumber]
 * Fetch a specific project stage
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
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
      .select("id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch stage
    const { data: stage, error } = await supabase
      .from("project_stages")
      .select("*")
      .eq("project_id", projectId)
      .eq("stage_number", stageNum)
      .single();

    if (error) {
      logger.error("Error fetching stage", { error, projectId, stageNumber });
      return NextResponse.json(
        { error: "Failed to fetch stage" },
        { status: 500 }
      );
    }

    return NextResponse.json({ stage });
  } catch (error) {
    logger.error("Error in GET /api/projects/[id]/stages/[stageNumber]", {
      error,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/projects/[id]/stages/[stageNumber]
 * Update a project stage
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
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
      .select("id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = await req.json();
    const { responses, summary, completed } = body;

    const updates: Partial<Database["public"]["Tables"]["project_stages"]["Update"]> =
      {};

    if (responses !== undefined) {
      updates.responses = responses;
    }
    if (summary !== undefined) {
      updates.summary = summary;
    }
    if (completed !== undefined) {
      updates.completed = completed;
      if (completed) {
        updates.completed_at = new Date().toISOString();
      }
    }

    // Update stage
    const { data: stage, error } = await supabase
      .from("project_stages")
      .update(updates)
      .eq("project_id", projectId)
      .eq("stage_number", stageNum)
      .select()
      .single();

    if (error) {
      logger.error("Error updating stage", { error, projectId, stageNumber });
      return NextResponse.json(
        { error: "Failed to update stage" },
        { status: 500 }
      );
    }

    // If stage is completed, update project's current_stage if needed
    if (completed && stageNum < 3) {
      await supabase
        .from("projects")
        .update({ current_stage: stageNum + 1 })
        .eq("id", projectId);
    }

    logger.info("Stage updated", {
      projectId,
      stageNumber: stageNum,
      completed,
    });

    return NextResponse.json({ stage });
  } catch (error) {
    logger.error("Error in PATCH /api/projects/[id]/stages/[stageNumber]", {
      error,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
