import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const AUTH_COOKIE = "token";

/**
 * Optimistic route guard: pages under /projects need a session, /login and /signup are for guests.
 * If JWT_SECRET is set here (same value as the API), the token's signature and expiry are checked;
 * otherwise only its presence is. The API checks every request itself either way.
 */
async function hasSession(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return false;
  const secret = process.env.JWT_SECRET;
  if (!secret) return true;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const signedIn = await hasSession(req);
  const isGuestPage = pathname === "/login" || pathname === "/signup";

  if (!signedIn && !isGuestPage) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname + search);
    const res = NextResponse.redirect(url);
    if (req.cookies.has(AUTH_COOKIE)) res.cookies.delete(AUTH_COOKIE);
    return res;
  }
  if (signedIn && isGuestPage) {
    return NextResponse.redirect(new URL("/projects", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/projects/:path*", "/login", "/signup"],
};
