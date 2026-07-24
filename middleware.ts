import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
// NOTE: Middleware intentionally does NOT enforce auth.
// Auth is handled client-side via localStorage.

export async function middleware(req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/focusimporter",
    "/focusimporter/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
