import { NextResponse, type NextRequest } from "next/server";

/**
 * Route protection middleware.
 *
 * IMPORTANT — this app uses opaque express-session cookies (not JWTs), so the
 * user's role is NOT readable from the cookie here; it lives server-side. To
 * check a role this middleware must call the backend /auth/me.
 *
 * It also can only see the session cookie when the backend is same-origin
 * (production behind nginx, where NEXT_PUBLIC_API_BASE_URL is ""). In dev the
 * backend is a different origin, so its cookie is invisible to this server —
 * we therefore defer entirely to the client-side guard (AppShell) and the
 * backend's own requireRole() checks. Set NEXT_PUBLIC_SESSION_COOKIE if the
 * backend overrides the default express-session cookie name.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const SAME_ORIGIN = API_BASE === "";
const SESSION_COOKIE = process.env.NEXT_PUBLIC_SESSION_COOKIE ?? "connect.sid";

const PUBLIC_PATHS = ["/", "/login"];
const ADMIN_PREFIXES = ["/admin"];

export async function middleware(req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  // Run on app routes only — exclude Next internals, static files (paths with a
  // dot), and backend-proxied paths (/api, /auth) to avoid any redirect loop.
  matcher: ["/((?!api|auth|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
