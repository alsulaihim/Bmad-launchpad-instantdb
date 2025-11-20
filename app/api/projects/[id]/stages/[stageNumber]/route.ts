/**
 * API Route: Project Stages
 * Handles operations for individual project stages
 */

import { NextRequest, NextResponse } from "next/server";
import { dbAdmin, verifyAuthToken } from "@/lib/instantdb/admin";
import { logger } from "@/lib/logger";

interface RouteContext {
  params: Promise<{
    id: string;
    stageNumber: string;
  }>;
}

/**
 * GET /api/projects/[id]/stages/[stageNumber]
 * Fetch a specific project stage
 */
export async function GET(req: NextRequest, context: RouteContext) {
  const params = await context.params;
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

    const { id: projectId, stageNumber } = params;
    const stageNum = parseInt(stageNumber);

    if (isNaN(stageNum) || stageNum < 1 || stageNum > 3) {
      return NextResponse.json(
        { error: "Invalid stage number" },
        { status: 400 }
      );
    }

    // Verify project ownership
    const projectQuery = await dbAdmin.query({
      projects: {
        $: {
          where: {
            id: projectId,
            "owner.id": user.id
          }
        }
      }
    });

    const project = projectQuery.projects && projectQuery.projects.length > 0 ? projectQuery.projects[0] : null;

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch stage
    const stageQuery = await dbAdmin.query({
      project_stages: {
        $: {
          where: {
            "project.id": projectId,
            stage_number: stageNum
          }
        }
      }
    });

    const stage = stageQuery.project_stages && stageQuery.project_stages.length > 0 ? stageQuery.project_stages[0] : null;

    if (!stage) {
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
export async function PATCH(req: NextRequest, context: RouteContext) {
  const params = await context.params;
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
            "owner.id": user.id
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
      }
    });

    const project = projectQuery.projects && projectQuery.projects.length > 0 ? projectQuery.projects[0] : null;
    const stage = projectQuery.project_stages && projectQuery.project_stages.length > 0 ? projectQuery.project_stages[0] : null;

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (!stage) {
      return NextResponse.json({ error: "Stage not found" }, { status: 404 });
    }

    const body = await req.json();
    const { responses, summary, completed } = body;

    const updates: any = {}; // Use any for partial updates

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
    
    updates.updated_at = new Date().toISOString();

    const txSteps = [];
    
    // Update stage
    txSteps.push(
      dbAdmin.tx.project_stages[stage.id].update(updates)
    );

    // If stage is completed, update project's current_stage if needed
    if (completed && stageNum < 3) {
      txSteps.push(
        dbAdmin.tx.projects[projectId].update({ current_stage: stageNum + 1 })
      );
    }

    await dbAdmin.transact(txSteps);

    // Return updated stage data
    // InstantDB transact doesn't return data, so we might need to refetch or just return what we updated.
    // For simplicity, return the merged object
    const updatedStage = { ...stage, ...updates };

    logger.info("Stage updated", {
      projectId,
      stageNumber: stageNum,
      completed,
    });

    return NextResponse.json({ stage: updatedStage });
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
