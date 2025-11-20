/**
 * API Route: Single Project
 * Get details for a specific project
 */

import { NextRequest, NextResponse } from "next/server";
import { dbAdmin, verifyAuthToken } from "@/lib/instantdb/admin";
import { logger } from "@/lib/logger";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/projects/[id]
 * Fetch a specific project
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

    const { id: projectId } = params;

    // Fetch project
    const queryResult = await dbAdmin.query({
      projects: {
        $: {
          where: {
            id: projectId,
            "owner.id": user.id
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
