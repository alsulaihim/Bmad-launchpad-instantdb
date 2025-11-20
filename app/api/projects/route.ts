/**
 * API Route: Projects
 * Handles CRUD operations for user projects
 */

import { NextRequest, NextResponse } from "next/server";
import { dbAdmin, verifyAuthToken } from "@/lib/instantdb/admin";
import { id } from "@instantdb/admin";
import { logger } from "@/lib/logger";

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
    const user = await verifyAuthToken(token);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user's projects
    // Query projects where owner.id matches user.id
    const queryResult = await dbAdmin.query({
      projects: {
        $: {
          where: { "owner.id": user.id },
          order: { created_at: "desc" } // InstantDB sort syntax might differ, checking...
          // InstantQL doesn't support server-side sort in 'query' effectively yet? 
          // Actually it does via sort key or client side. 
          // For now, let's just fetch and sort in memory if needed, or assume basic order.
        } 
      }
    });

    const projects = queryResult.projects || [];
    // Sort in memory if needed
    projects.sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

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
    const user = await verifyAuthToken(token);

    if (!user) {
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

    const projectId = id();
    const now = new Date().toISOString();

    // Create project and link to user (profile)
    // We assume profile exists with ID = user.id (ensured by check-profile or login flow)
    
    // Create stages
    const stagesData = [
      { stage_number: 1, stage_name: "Brainstorming & Requirements" },
      { stage_number: 2, stage_name: "Tech Stack & Architecture" },
      { stage_number: 3, stage_name: "UI/UX Design" },
    ];

    const txSteps = [];

    // Create Project
    txSteps.push(
      dbAdmin.tx.projects[projectId].update({
        name,
        description: description || "",
        status: "in_progress",
        current_stage: 1,
        created_at: now,
        updated_at: now,
      }).link({ owner: user.id })
    );

    // Create Stages
    stagesData.forEach(stage => {
      const stageId = id();
      txSteps.push(
        dbAdmin.tx.project_stages[stageId].update({
          stage_number: stage.stage_number,
          stage_name: stage.stage_name,
          responses: {}, // Empty JSON
          completed: false,
          created_at: now,
          updated_at: now,
        }).link({ project: projectId }) // Link to project using 'project' label (reverse of stages)
        // Check schema: stageProject -> forward on project_stages has "project" label. Correct.
      );
    });

    await dbAdmin.transact(txSteps);

    const project = {
      id: projectId,
      name,
      description: description || "",
      status: "in_progress",
      current_stage: 1,
      created_at: now,
      updated_at: now,
      user_id: user.id // mimic Supabase response
    };

    logger.info("Project created", { projectId, userId: user.id });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    logger.error("Error in POST /api/projects", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
