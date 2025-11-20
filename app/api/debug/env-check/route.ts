/**
 * Debug API: Check Environment Variables
 * Helps verify that required env vars are set in production
 *
 * Usage: GET /api/debug/env-check
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    instantdbAppId: {
      set: !!process.env.NEXT_PUBLIC_INSTANTDB_APP_ID,
      value: process.env.NEXT_PUBLIC_INSTANTDB_APP_ID ? "Set" : "Not Set",
    },
    instantdbAdminToken: {
      set: !!process.env.INSTANTDB_ADMIN_TOKEN,
      value: process.env.INSTANTDB_ADMIN_TOKEN ? "Set" : "Not Set",
    },
    encryptionKey: {
      set: !!process.env.ENCRYPTION_KEY,
      length: process.env.ENCRYPTION_KEY?.length || 0,
    },
    nodeEnv: process.env.NODE_ENV,
  });
}
