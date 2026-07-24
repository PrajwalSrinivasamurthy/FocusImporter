import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { log, requestMeta } from "@/lib/logger";

export const runtime = "nodejs";

// ── PATCH /api/history/[jobId] ────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { ip, userAgent } = requestMeta(req);
  // LocalStorage-based auth: client passes email as a query param.
  const email = (req.nextUrl.searchParams.get("email") ?? "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 });

  const { jobId } = await params;

  try {
    const db = getDb();
    // Ensure the job belongs to the given email.
    const record = db
      .prepare(
        `SELECT id
         FROM focus_conversion_history
         WHERE job_id = ? AND email = ?`,
      )
      .get(jobId, email) as { id: number } | undefined;

    if (!record) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    // No-op for now: issues_overridden is no longer persisted in SQLite schema.

    log({
      level: "info",
      event: "conversion.issues_overridden",
      email,
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
      email,
      ip,
      userAgent,
      details: { jobId, error: String(err) },
    });
    return NextResponse.json({ error: "Failed to update record." }, { status: 500 });
  }
}
