// Deprecated: replaced by /api/auth/change-password
// Kept temporarily to avoid breaking older clients; will be removed later.

import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function PUT() {
  return NextResponse.json(
    { error: "Deprecated. Use /api/auth/change-password." },
    { status: 410 },
  );
}
