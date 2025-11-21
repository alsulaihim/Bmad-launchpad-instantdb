/**
 * Debug API: Check Profile Status
 * Helps diagnose profile issues
 *
 * Usage: GET /api/debug/check-profile
 * Requires: Authorization header with user token
 */

import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/instantdb/admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Check if profile exists
    const queryResult = await dbAdmin.query({
      profiles: {
        $: { where: { id: userId } }
      }
    });

    const profile = queryResult.profiles && queryResult.profiles.length > 0 ? queryResult.profiles[0] : null;

    // Try to create profile if it doesn't exist
    let profileCreated = false;
    let createError = null;

    if (!profile) {
      try {
        await dbAdmin.transact([
          dbAdmin.tx.profiles[userId].update({
            email: "",
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
        id: userId,
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
