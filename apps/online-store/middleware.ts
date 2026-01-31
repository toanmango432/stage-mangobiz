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

  // Accumulate cookies to set on the final response
  // This prevents cookie loss when setAll is called multiple times during token refresh
  const cookiesToUpdate: Array<{
    name: string;
    value: string;
    options?: Parameters<typeof NextResponse.prototype.cookies.set>[2];
  }> = [];

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
          // Accumulate cookies instead of creating new response each time
          cookiesToSet.forEach(({ name, value, options }) => {
            // Remove any previous entry for this cookie name to avoid duplicates
            const existingIndex = cookiesToUpdate.findIndex(
              (c) => c.name === name
            );
            if (existingIndex >= 0) {
              cookiesToUpdate.splice(existingIndex, 1);
            }
            cookiesToUpdate.push({ name, value, options });
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

  // Create final response with all accumulated cookies
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Apply all accumulated cookies to the response
  cookiesToUpdate.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*'],
};
