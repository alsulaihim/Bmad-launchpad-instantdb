/**
 * API Route: Get PRD
 * Fetches existing PRD from database
 */

import { NextRequest, NextResponse } from "next/server";
import { dbAdmin, verifyAuthToken } from "@/lib/instantdb/admin";
import { logger } from "@/lib/logger";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

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

    // Fetch PRD from database
    const prdQuery = await dbAdmin.query({
      prd_documents: {
        $: {
          where: { "project.id": projectId },
          // order: { created_at: "desc" } // if supported
        }
      }
    });

    const prds = prdQuery.prd_documents || [];
    // Sort to get latest if needed
    prds.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    const prd = prds.length > 0 ? prds[0] : null;

    if (!prd) {
      return NextResponse.json({ prd: null });
    }

    return NextResponse.json({ prd });
  } catch (error) {
    logger.error("Error in GET /api/projects/[id]/prd", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
