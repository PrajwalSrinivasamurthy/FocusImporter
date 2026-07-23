import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

// ── GET /api/health ─────────────────────────────────────────────────────────
// Unauthenticated liveness probe for the uptime-check cron job (see
// scripts/health-check-cron.js). Confirms both the Next.js server and its
// database connection are responsive.

export async function GET() {
  try {
    // During `next build`, Next may pre-render and attempt to execute this route.
    // If DATABASE_URL points at a docker hostname (e.g. postgres-db) and we're not
    // in docker, DNS will fail and spam the build output.
    //
    // At runtime we *do* want DB connectivity to affect health, but at build-time
    // we skip it entirely.
    const isBuildTime =
      process.env.NEXT_PHASE === "phase-production-build" ||
      process.env.npm_lifecycle_event === "build";

    if (!isBuildTime) {
      getDb().prepare("SELECT 1").get();
    }
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("[health/GET]", err);
    return NextResponse.json({ status: "error" }, { status: 503 });
  }
}
