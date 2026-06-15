import { NextResponse, type NextRequest } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";
import { log, requestMeta } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { ip, userAgent } = requestMeta(req);
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  log({
    level: "info",
    event: "auth.logout",
    userId: session?.userId,
    email: session?.email,
    ip,
    userAgent,
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
