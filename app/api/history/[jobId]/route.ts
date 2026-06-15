import { NextResponse, type NextRequest } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { log, requestMeta } from "@/lib/logger";

export const runtime = "nodejs";

// ── PATCH /api/history/[jobId] ────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { ip, userAgent } = requestMeta(req);
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const session = await verifySession(token);
  if (!session) return NextResponse.json({ error: "Session expired." }, { status: 401 });

  const { jobId } = await params;

  try {
    getDb().prepare(
      `UPDATE focus_conversion_history
       SET    issues_overridden = 1
       WHERE  job_id  = ?
         AND  user_id = ?`,
    ).run(jobId, session.userId);

    log({
      level: "info",
      event: "conversion.issues_overridden",
      userId: session.userId,
      email: session.email,
      ip,
      userAgent,
      details: { jobId },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[history/PATCH]", err);
    log({
      level: "error",
      event: "conversion.override.error",
      userId: session.userId,
      email: session.email,
      ip,
      userAgent,
      details: { jobId, error: String(err) },
    });
    return NextResponse.json({ error: "Failed to update record." }, { status: 500 });
  }
}
