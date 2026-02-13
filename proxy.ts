import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from './lib/session';

// Public routes that don't require authentication
const publicRoutes = ['/auth'];

// Protected routes that require authentication
const protectedRoutes = ['/transcripts', '/'];

export async function proxy(request: NextRequest) {
    const path = request.nextUrl.pathname;
    
    // Check if the route is public
    const isPublicRoute = publicRoutes.some(route => path.startsWith(route));
    
    // Check if the route is protected
    const isProtectedRoute = protectedRoutes.some(route => 
        route === '/' ? path === '/' : path.startsWith(route)
    );

    // 1. Get session from cookies
    const cookie = request.cookies.get('session')?.value;
    const session = cookie ? await verifySession(cookie) : null;

    // 2. Redirect logic for protected routes
    if (isProtectedRoute && !session) {
        // User is not authenticated, redirect to login/auth page
        return NextResponse.redirect(new URL('/auth', request.url));
    }

    // 3. Redirect logic for public routes (prevent logged-in users from accessing auth pages)
    if (isPublicRoute && session) {
        // User is already authenticated, redirect to home
        return NextResponse.redirect(new URL('/', request.url));
    }

    // 4. Allow the request to proceed
    return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images, etc.)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.webp).*)',
    ],
};