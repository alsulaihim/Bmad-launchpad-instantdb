/**
 * API Route: Projects
 * Handles CRUD operations for user projects
 */

import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/instantdb/admin";
import { id } from "@instantdb/admin";
import { logger } from "@/lib/logger";

/**
 * GET /api/projects
 * Fetch all projects for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    // Get userId from query parameter
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Fetch user's projects
    // Query projects where owner.id matches userId
    const queryResult = await dbAdmin.query({
      projects: {
        $: {
          where: { "owner.id": userId },
          order: { serverCreatedAt: "desc" }
        }
      }
    });

    const projects = queryResult.projects || [];
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
    const body = await req.json();
    const { name, description, userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

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
      }).link({ owner: userId })
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
      user_id: userId
    };

    logger.info("Project created", { projectId, userId });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    logger.error("Error in POST /api/projects", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects?projectId=xxx&userId=xxx
 * Delete a project and all associated data
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const userId = searchParams.get("userId");

    if (!projectId || !userId) {
      return NextResponse.json(
        { error: "Project ID and User ID are required" },
        { status: 400 }
      );
    }

    // Verify project ownership
    const queryResult = await dbAdmin.query({
      projects: {
        $: { where: { id: projectId, "owner.id": userId } }
      }
    });

    if (!queryResult.projects || queryResult.projects.length === 0) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      );
    }

    // Delete the project (cascade should handle related data)
    await dbAdmin.transact([
      dbAdmin.tx.projects[projectId].delete()
    ]);

    logger.info("Project deleted", { projectId, userId });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    logger.error("Error in DELETE /api/projects", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
