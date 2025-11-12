/**
 * Admin API: Fix missing profiles
 * Creates profiles for all users that don't have one
 *
 * Usage: GET /api/admin/fix-profiles?admin_key=YOUR_SERVICE_KEY
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/types/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: NextRequest) {
  try {
    // Simple authentication - require service key in query param
    const adminKey = req.nextUrl.searchParams.get('admin_key');

    if (!adminKey || adminKey !== supabaseServiceKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // Get all users
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      return NextResponse.json(
        { error: "Failed to fetch users", details: usersError },
        { status: 500 }
      );
    }

    // Get all existing profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id');

    if (profilesError) {
      return NextResponse.json(
        { error: "Failed to fetch profiles", details: profilesError },
        { status: 500 }
      );
    }

    const existingProfileIds = new Set(profiles?.map(p => p.id) || []);

    // Find users without profiles
    const usersWithoutProfiles = users.filter(user => !existingProfileIds.has(user.id));

    if (usersWithoutProfiles.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All users already have profiles",
        totalUsers: users.length,
        usersFixed: 0,
      });
    }

    // Create profiles for users without them
    const results = [];
    for (const user of usersWithoutProfiles) {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || null,
        } as never);

      results.push({
        email: user.email,
        success: !insertError,
        error: insertError?.message || null,
      });
    }

    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({
      success: true,
      message: `Created ${successCount} profiles out of ${usersWithoutProfiles.length} missing`,
      totalUsers: users.length,
      usersFixed: successCount,
      details: results,
    });

  } catch (error) {
    console.error('Error in fix-profiles route:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}