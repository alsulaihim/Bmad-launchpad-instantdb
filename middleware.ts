import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware for security headers and request handling
 * Implements OWASP security best practices
 * @see https://owasp.org/www-project-secure-headers/
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security headers aligned with OWASP ASVS
  const securityHeaders = {
    // Prevent clickjacking attacks
    "X-Frame-Options": "DENY",
    
    // XSS protection
    "X-Content-Type-Options": "nosniff",
    "X-XSS-Protection": "1; mode=block",
    
    // Referrer policy - restrict information leakage
    "Referrer-Policy": "strict-origin-when-cross-origin",
    
    // Permissions policy - restrict browser features
    "Permissions-Policy":
      "camera=(), microphone=(), geolocation=(), interest-cohort=()",
    
    // Content Security Policy (CSP)
    // Adjust based on your application's needs
    "Content-Security-Policy": [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval and unsafe-inline for development
      "style-src 'self' 'unsafe-inline'", // Required for Tailwind and inline styles
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-ancestors 'none'",
    ].join("; "),
  };

  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // HSTS (HTTP Strict Transport Security) - only in production
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  return response;
}

// Apply middleware to all routes except static assets
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

