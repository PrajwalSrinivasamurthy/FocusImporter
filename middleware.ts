import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";

const BASE_PATH = "/focusimporter";
const PUBLIC = [`${BASE_PATH}/login`, `${BASE_PATH}/api/auth`, `${BASE_PATH}/api/health`];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;

  if (!token) {
    return NextResponse.redirect(new URL(`${BASE_PATH}/login`, req.url));
  }

  const session = await verifySession(token);
  if (!session) {
    const res = NextResponse.redirect(new URL(`${BASE_PATH}/login`, req.url));
    // Ensure we clear the cookie for the basePath cookie scope.
    res.cookies.set(SESSION_COOKIE, "", { path: BASE_PATH, maxAge: 0 });
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/focusimporter",
    "/focusimporter/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
