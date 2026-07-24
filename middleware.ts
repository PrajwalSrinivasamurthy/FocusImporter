import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
// AUTH DISABLED (temporary)
// Keeping the original auth middleware logic commented out below.

export async function middleware(req: NextRequest) {
  return NextResponse.next();

  /*
  import { SESSION_COOKIE } from "@/lib/auth";

  const BASE_PATH = "/focusimporter";
  const PUBLIC = [`${BASE_PATH}/login`, `${BASE_PATH}/api/auth`, `${BASE_PATH}/api/health`];

  const { pathname } = req.nextUrl;

  if (PUBLIC.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;

  if (!token) {
    return NextResponse.redirect(new URL(`${BASE_PATH}/login`, req.url));
  }

  return NextResponse.next();
  */
}

export const config = {
  matcher: [
    "/focusimporter",
    "/focusimporter/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
