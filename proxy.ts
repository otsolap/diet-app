import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/src/lib/session-cookie";

const PUBLIC_PAGES = new Set(["/", "/about", "/login", "/setup"]);

const PUBLIC_API = new Set([
  "/api/auth/login",
  "/api/auth/setup",
  "/api/auth/accept",
  "/api/auth/logout",
]);

function hasSession(request: NextRequest) {
  return Boolean(request.cookies.get(SESSION_COOKIE)?.value);
}

function isPublicPage(pathname: string) {
  if (PUBLIC_PAGES.has(pathname)) {
    return true;
  }

  return /^\/invite\/[^/]+$/.test(pathname);
}

function signInRedirect(request: NextRequest) {
  return NextResponse.redirect(new URL("/login?error=signedout", request.url), 303);
}

export function proxy(request: NextRequest) {
  if (hasSession(request)) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    if (PUBLIC_API.has(pathname)) {
      return NextResponse.next();
    }

    if (pathname.startsWith("/api/auth/")) {
      return signInRedirect(request);
    }

    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }

  if (isPublicPage(pathname)) {
    return NextResponse.next();
  }

  return signInRedirect(request);
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
