/**
 * Debug API: Check Profile Status
 * Helps diagnose profile issues
 *
 * Usage: GET /api/debug/check-profile
 * Requires: Authorization header with user token
 */

import { NextRequest, NextResponse } from "next/server";
import { dbAdmin, verifyAuthToken } from "@/lib/instantdb/admin";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const user = await verifyAuthToken(token);

    if (!user) {
      return NextResponse.json({
        error: "Authentication failed",
      }, { status: 401 });
    }

    // Check if profile exists
    const queryResult = await dbAdmin.query({
      profiles: {
        $: { where: { id: user.id } }
      }
    });
    
    const profile = queryResult.profiles && queryResult.profiles.length > 0 ? queryResult.profiles[0] : null;

    // Try to create profile if it doesn't exist
    let profileCreated = false;
    let createError = null;

    if (!profile) {
      try {
        // @ts-ignore - tx types might be tricky to infer perfectly without full generation
        await dbAdmin.transact([
          dbAdmin.tx.profiles[user.id].update({
            email: user.email || "",
            full_name: "", 
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        ]);
        profileCreated = true;
      } catch (err) {
        createError = err;
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      profile: {
        exists: !!profile,
        data: profile,
      },
      profileCreation: {
        attempted: !profile,
        success: profileCreated,
        error: createError,
      },
      environment: {
        instantDbSet: true
      }
    });

  } catch (error) {
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
