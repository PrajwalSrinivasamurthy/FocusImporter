import { NextResponse, type NextRequest } from "next/server";
import { verifySession, getBearerToken } from "@/lib/auth";
import { log, requestMeta } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { ip, userAgent } = requestMeta(req);
  const token = getBearerToken(req);
  const session = token ? await verifySession(token) : null;

  log({
    level: "info",
    event: "auth.logout",
    userId: session?.userId,
    email: session?.email,
    ip,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}
