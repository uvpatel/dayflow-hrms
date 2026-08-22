import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request);

  // Public auth pages: redirect already-authenticated users to /dashboard
  if (pathname === "/sign-in" || pathname === "/signup") {
    if (sessionCookie) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Protected areas: redirect unauthenticated users to /sign-in
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
    if (!sessionCookie) {
      const signInUrl = new URL("/sign-in", request.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/sign-in",
    "/signup",
  ],
};
