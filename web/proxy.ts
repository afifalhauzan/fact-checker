import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = ["/", "/login"];
const protectedRoutes = ["/chat", "/selection"];
const legacyRouteRedirects: Record<string, string> = {
  "/landing": "/",
  "/dashboard": "/selection",
};

// The export name is now 'proxy' instead of 'middleware'
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (legacyRouteRedirects[pathname]) {
    return NextResponse.redirect(new URL(legacyRouteRedirects[pathname], request.url));
  }
  
  // Skip middleware for API routes, static files
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Check for API-key authentication (new system)
  const apiKey = request.cookies.get('X-API-Key')?.value
  
  // Check for legacy auth (Google OAuth compatibility)
  const legacyAuthCookie = request.cookies.get('auth-storage')?.value
  let hasLegacyAuth = false
  
  if (legacyAuthCookie) {
    try {
      const authData = JSON.parse(legacyAuthCookie)
      hasLegacyAuth = authData?.isAuthenticated && !!authData?.accessToken
    } catch (error) {
      console.error('Auth cookie parse error:', error)
      // Clear invalid cookie
      const response = NextResponse.next()
      response.cookies.delete('auth-storage')
      hasLegacyAuth = false
    }
  }

  const isAuthenticated = !!apiKey || hasLegacyAuth

  // 1. Handle Public Routes & Logged-in Redirection
  if (publicRoutes.includes(pathname)) {
    if (pathname === "/login" && isAuthenticated) {
      return NextResponse.redirect(new URL("/chat", request.url));
    }
    return NextResponse.next();
  }
  
  // 2. Protect Authenticated Routes
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
  
  if (isProtectedRoute && !isAuthenticated) {
    // Redirect to login but keep the intended destination in searchParams
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Next.js 16 recommends being more explicit with the matcher 
     * to avoid unnecessary proxy execution on assets.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
