import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Next.js Middleware for route-level auth protection.
 *
 * Protects /admin/* and /account routes by checking Supabase auth session
 * from cookies. Redirects unauthenticated users to /login with a returnTo
 * query param for post-login navigation.
 *
 * Runs on the Edge runtime — keep it lightweight (no heavy DB queries).
 */

const PROTECTED_PATHS = ['/admin', '/account'];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only check auth for protected paths
  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  // Create a response to pass through (allows cookie updates)
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase client with cookie access for session reading/refreshing
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Update request cookies (for downstream server components)
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          // Update response cookies (for the browser)
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh the session — this updates expired tokens via cookies
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users to login with returnTo
  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*'],
};
