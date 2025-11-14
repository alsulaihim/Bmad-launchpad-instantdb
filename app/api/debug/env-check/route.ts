/**
 * Debug API: Check Environment Variables
 * Helps verify that required env vars are set in production
 *
 * Usage: GET /api/debug/env-check
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    supabaseUrl: {
      set: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      value: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + "...",
    },
    supabaseAnonKey: {
      set: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      length: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
      prefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + "...",
    },
    supabaseServiceKey: {
      set: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
      prefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + "...",
    },
    encryptionKey: {
      set: !!process.env.ENCRYPTION_KEY,
      length: process.env.ENCRYPTION_KEY?.length || 0,
    },
    nodeEnv: process.env.NODE_ENV,
  });
}