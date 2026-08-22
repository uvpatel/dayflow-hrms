import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { sanitizeCallbackPath } from "@/lib/auth/redirects";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request);

  // Protected dashboard routes: if definitely no session cookie, redirect to /sign-in
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/employee") ||
    pathname.startsWith("/manager") ||
    pathname.startsWith("/hr")
  ) {
    if (!sessionCookie) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set(
        "callbackURL",
        sanitizeCallbackPath(`${pathname}${request.nextUrl.search}`),
      );
      return NextResponse.redirect(signInUrl);
    }
  }

  // Canonicalize /signup to /sign-up if requested
  if (pathname === "/signup") {
    const signUpUrl = request.nextUrl.clone();
    signUpUrl.pathname = "/sign-up";
    return NextResponse.redirect(signUpUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/employee/:path*",
    "/manager/:path*",
    "/hr/:path*",
    "/signup",
  ],
};
