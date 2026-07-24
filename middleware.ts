import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

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

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/focusimporter",
    "/focusimporter/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
