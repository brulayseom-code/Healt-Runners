import { cookies } from "next/headers";
import { ensureProfile } from "@/lib/dashboard";
import { PROFILE_ID_PATTERN, SESSION_HEADER } from "@/lib/photo";

type CookieJar = Awaited<ReturnType<typeof cookies>>;
const COOKIE_NAME = "gymrats_session";

// The app can run embedded in an iframe where browsers block the session cookie
// (third-party context). To stay reliable we also accept the id from a header the
// client stores locally, and fall back to the cookie when it is available.
export function resolveSessionId(request: Request, jar: CookieJar): string | undefined {
  const header = request.headers.get(SESSION_HEADER);
  if (header && PROFILE_ID_PATTERN.test(header)) return header;
  return jar.get(COOKIE_NAME)?.value;
}

function isHttps(request: Request): boolean {
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0].trim();
  if (proto) return proto === "https";
  try { return new URL(request.url).protocol === "https:"; } catch { return false; }
}

export function persistSessionCookie(request: Request, jar: CookieJar, id: string) {
  const secure = isHttps(request);
  jar.set(COOKIE_NAME, id, {
    httpOnly: true,
    // SameSite=None (with Secure) lets the cookie survive inside embedded iframes.
    sameSite: secure ? "none" : "lax",
    secure,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
}

export async function resolveProfile(request: Request, jar: CookieJar) {
  const profile = await ensureProfile(resolveSessionId(request, jar));
  persistSessionCookie(request, jar, profile.id);
  return profile;
}

// Switches the active session to a specific profile (used on login / logout).
export function setSession(request: Request, jar: CookieJar, id: string) {
  persistSessionCookie(request, jar, id);
}
