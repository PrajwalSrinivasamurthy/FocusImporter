import { NextResponse, type NextRequest } from "next/server";
import { log, requestMeta } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { ip, userAgent } = requestMeta(req);
  log({
    level: "info",
    event: "auth.logout",
    ip,
    userAgent,
  });

  // No cookies; client clears localStorage.
  return NextResponse.json({ ok: true });
}
