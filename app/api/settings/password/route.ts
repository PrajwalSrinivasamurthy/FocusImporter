import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { verifySession, getBearerToken } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { log, requestMeta } from "@/lib/logger";

export const runtime = "nodejs";

export async function PUT(req: NextRequest) {
  const { ip, userAgent } = requestMeta(req);

  const token = getBearerToken(req);
  if (!token) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const session = await verifySession(token);
  if (!session) return NextResponse.json({ error: "Session expired." }, { status: 401 });

  let currentPassword: string, newPassword: string;
  try {
    ({ currentPassword, newPassword } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  try {
    const user = getDb()
      .prepare<[number], { password_hash: string }>(
        "SELECT password_hash FROM dashboard_users WHERE id = ?",
      )
      .get(session.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match) {
      log({
        level: "warn",
        event: "settings.password.wrong_current",
        userId: session.userId,
        email: session.email,
        ip,
        userAgent,
      });
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 400 }
      );
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    getDb().prepare(
      `UPDATE dashboard_users
       SET password_hash  = ?,
           token_version  = token_version + 1,
           updated_at     = CURRENT_TIMESTAMP
       WHERE id = ?`,
    ).run(newHash, session.userId);

    log({
      level: "info",
      event: "settings.password.changed",
      userId: session.userId,
      email: session.email,
      ip,
      userAgent,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[settings/password]", err);
    log({
      level: "error",
      event: "settings.password.error",
      userId: session.userId,
      email: session.email,
      ip,
      userAgent,
      details: { error: String(err) },
    });
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
