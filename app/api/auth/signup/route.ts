/**
 * Server-side signup API route
 * Handles user registration with automatic email confirmation
 * This is a workaround for email confirmation delivery issues
 */

import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();

    // Create Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // Create the user account
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (signUpError) {
      return NextResponse.json(
        { error: signUpError.message },
        { status: 400 }
      );
    }

    // Since email confirmations aren't working, try to sign them in immediately
    // This will only work if email confirmations are disabled in Supabase
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      // If sign in fails, the account was created but needs confirmation
      // Guide user to use magic links
      return NextResponse.json({
        success: true,
        requiresMagicLink: true,
        message: "Account created successfully! Since email confirmations are not being delivered, please use the 'Send Magic Link' option to access your account.",
      });
    }

    if (signInData.session) {
      // Successfully signed in
      return NextResponse.json({
        success: true,
        requiresMagicLink: false,
        message: "Account created and logged in successfully!",
        user: signInData.user,
      });
    }

    // Fallback response
    return NextResponse.json({
      success: true,
      requiresMagicLink: true,
      message: "Account created! Please use the magic link option to sign in.",
    });

  } catch (error) {
    console.error("Signup API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}