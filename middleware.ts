import { NextResponse } from 'next/server';
import { GATE_COOKIE, gateToken } from './lib/site-gate';

// Paths reachable without the site password (the unlock form itself, and the
// internal path-config fetch this middleware makes without cookies).
const GATE_OPEN = ['/unlock', '/api/unlock', '/api/admin/config/paths', '/api/health'];

export async function middleware(request) {
    const { pathname } = request.nextUrl;

    const sitePassword = process.env.SITE_PASSWORD;
    if (sitePassword && !GATE_OPEN.includes(pathname)) {
        const cookie = request.cookies.get(GATE_COOKIE)?.value;
        if (cookie !== (await gateToken(sitePassword))) {
            if (pathname.startsWith('/api') || pathname.startsWith('/payload-api')) {
                return NextResponse.json({ error: 'Locked' }, { status: 401 });
            }
            const url = new URL('/unlock', request.url);
            url.searchParams.set('next', pathname + request.nextUrl.search);
            return NextResponse.redirect(url);
        }
    }

    // Skip internal paths, static files, and admin routes (both existing /admin and the
    // parallel Payload CMS admin mounted at /payload-admin / /payload-api).
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/admin') ||
        pathname.startsWith('/payload-admin') ||
        pathname.startsWith('/payload-api') ||
        pathname.startsWith('/payload-graphql') ||
        pathname.includes('.') // file extensions
    ) {
        return NextResponse.next();
    }

    // Strategy: We can't easily query DB in Edge Middleware without specific setup.
    // For robustness in this hybrid environment, we will optimisticly allow access
    // if we can't verify, or we could use a specialized check.

    // NOTE: Fetching from localhost in middleware is often problematic in Next.js
    // because middleware runs before the request is routed.

    // Alternative: If managing critical paths, we might perform the check
    // in Layout or Page components, but Middleware is requested.

    // Let's try to fetch from the API using absolute URL if possible.
    // Use an internal URL if configured to avoid public loopback issues.
    const internalApiUrl = process.env.INTERNAL_API_URL || request.nextUrl.origin;

    try {
        // Short timeout to avoid blocking regular navigation
        const res = await fetch(`${internalApiUrl}/api/admin/config/paths`, {
            next: { revalidate: 60 },
            signal: AbortSignal.timeout(1500) // Increased timeout slightly
        });

        if (res.ok) {
            const data = await res.json();
            const disabledPaths = data.paths || [];

            // Check if current path starts with any disabled path
            // e.g. if '/worship' is disabled, '/worship/teams' should also be disabled
            const isBlocked = disabledPaths.some(disabledPath =>
                pathname === disabledPath || pathname.startsWith(`${disabledPath}/`)
            );

            if (isBlocked) {
                // Path is disabled
                return NextResponse.rewrite(new URL('/404', request.url));
            }
        }
    } catch (error) {
        // If fetch checks fail (e.g. cold start), we default to allowing access (fail open)
        // to prevent taking down the site.
        // Log sparingly to avoid log bloat if internal URL is failing
        if (process.env.NODE_ENV === 'development') {
            console.error('Middleware config check failed:', error.message);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * (/api is matched for the site password gate; the path-config
         * check below still skips it.)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
