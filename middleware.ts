import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BASE_PATH = "/focusimporter";
const AUTH_COOKIE = "fi_auth";

const PUBLIC = [
  `${BASE_PATH}/login`,
  `${BASE_PATH}/api/auth/login`,
  `${BASE_PATH}/api/auth/logout`,
  `${BASE_PATH}/api/health`,
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  // Cookie gate: prevents direct URL access when not logged in.
  // (Middleware can't read localStorage, so we use a simple cookie.)
  const cookie = req.cookies.get(AUTH_COOKIE)?.value;
  if (!cookie) {
    return NextResponse.redirect(new URL(`${BASE_PATH}/login`, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/focusimporter",
    "/focusimporter/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
