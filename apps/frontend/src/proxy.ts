import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken, SessionPayload } from "@/lib/auth/jwt";
import { UserRole, hasMinimumRole } from "@/lib/auth/roles";

const COOKIE_NAME = "session";

// Routes that require authentication
const protectedRoutes = ["/dashboard"];

// Routes that require specific roles
const roleProtectedRoutes: { path: string; minRole: UserRole }[] = [
  { path: "/dashboard/hr", minRole: "hr" },
  { path: "/dashboard/admin", minRole: "owner" },
];

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Get session from cookie
  const token = request.cookies.get(COOKIE_NAME)?.value;
  let session: SessionPayload | null = null;

  if (token) {
    session = await verifySessionToken(token);
  }

  // Redirect to login if not authenticated and trying to access protected route
  if (isProtectedRoute && !session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // Redirect to dashboard if authenticated and trying to access auth pages
  if (session && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Check role-based access
  if (session && isProtectedRoute) {
    for (const roleRoute of roleProtectedRoutes) {
      if (pathname.startsWith(roleRoute.path)) {
        if (!hasMinimumRole(session.role, roleRoute.minRole)) {
          const url = request.nextUrl.clone();
          url.pathname = "/dashboard";
          return NextResponse.redirect(url);
        }
        break;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
