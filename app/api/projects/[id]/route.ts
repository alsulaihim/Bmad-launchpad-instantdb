/**
 * API Route: Single Project
 * Get details for a specific project
 */

import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/instantdb/admin";
import { logger } from "@/lib/logger";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/projects/[id]
 * Fetch a specific project
 * Expects userId as query parameter
 */
export async function GET(req: NextRequest, context: RouteContext) {
  const params = await context.params;
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const { id: projectId } = params;

    // Fetch project
    const queryResult = await dbAdmin.query({
      projects: {
        $: {
          where: {
            id: projectId,
            "owner.id": userId
          }
        }
      }
    });

    const project = queryResult.projects && queryResult.projects.length > 0 ? queryResult.projects[0] : null;

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ project });
  } catch (error) {
    logger.error("Error in GET /api/projects/[id]", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
