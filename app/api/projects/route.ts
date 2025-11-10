/**
 * API Route: Projects
 * Handles CRUD operations for user projects
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/types/database.types";
import { logger } from "@/lib/logger";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/projects
 * Fetch all projects for the authenticated user
 */
export async function GET(req: NextRequest) {
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

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user's projects
    const { data: projects, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching projects", { error, userId: user.id });
      return NextResponse.json(
        { error: "Failed to fetch projects" },
        { status: 500 }
      );
    }

    return NextResponse.json({ projects });
  } catch (error) {
    logger.error("Error in GET /api/projects", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects
 * Create a new project
 */
export async function POST(req: NextRequest) {
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

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    // Create project
    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        name,
        description: description || null,
        status: "in_progress",
        current_stage: 1,
      } as never)
      .select()
      .single();

    type ProjectData = { id: string; [key: string]: unknown } | null;
    const typedProject = project as ProjectData;

    if (error || !typedProject) {
      logger.error("Error creating project", { error, userId: user.id });
      return NextResponse.json(
        { error: "Failed to create project" },
        { status: 500 }
      );
    }

    // Create initial stage entries
    const stages = [
      { stage_number: 1, stage_name: "Brainstorming & Requirements" },
      { stage_number: 2, stage_name: "Tech Stack & Architecture" },
      { stage_number: 3, stage_name: "UI/UX Design" },
    ];

    const { error: stagesError } = await supabase.from("project_stages").insert(
      stages.map((stage) => ({
        project_id: typedProject.id,
        stage_number: stage.stage_number,
        stage_name: stage.stage_name,
        responses: {},
        completed: false,
      })) as never
    );

    if (stagesError) {
      logger.error("Error creating project stages", {
        error: stagesError,
        projectId: typedProject.id,
      });
      // Don't fail the request, stages can be created later
    }

    logger.info("Project created", { projectId: typedProject.id, userId: user.id });

    return NextResponse.json({ project: typedProject }, { status: 201 });
  } catch (error) {
    logger.error("Error in POST /api/projects", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
