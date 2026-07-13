import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

// ── GET /api/health ─────────────────────────────────────────────────────────
// Unauthenticated liveness probe for the uptime-check cron job (see
// scripts/health-check-cron.js). Confirms both the Next.js server and its
// database connection are responsive.

export async function GET() {
  try {
    await getDb().query("SELECT 1");
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("[health/GET]", err);
    return NextResponse.json({ status: "error" }, { status: 503 });
  }
}
