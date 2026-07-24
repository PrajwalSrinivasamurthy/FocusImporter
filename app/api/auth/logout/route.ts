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

  // Clear cookie gate; client also clears localStorage.
  const res = NextResponse.json({ ok: true });
  res.cookies.set("fi_auth", "", { path: "/focusimporter", maxAge: 0 });
  return res;
}
