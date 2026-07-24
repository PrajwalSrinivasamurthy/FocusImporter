import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { log, requestMeta } from "@/lib/logger";

export const runtime = "nodejs";

interface Body {
  currentPassword: string;
  newPassword: string;
}

export async function POST(req: NextRequest) {
  // AUTH DISABLED (temporary)
  // Keep the original change-password behavior below for later re-enable.
  return NextResponse.json({ error: "Authentication is disabled." }, { status: 410 });

  /*
  const { ip, userAgent } = requestMeta(req);

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const session = await verifySession(token);
  if (!session) return NextResponse.json({ error: "Session expired." }, { status: 401 });

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.currentPassword || !body.newPassword) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }
  if (body.newPassword.length < 5) {
    return NextResponse.json({ error: "New password must be at least 5 characters." }, { status: 400 });
  }

  try {
    const db = getDb();
    const row = db
      .prepare("SELECT password_hash FROM dashboard_users WHERE id = ?")
      .get(session.userId) as { password_hash: string } | undefined;

    if (!row) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const match = await bcrypt.compare(body.currentPassword, row.password_hash);
    if (!match) {
      log({
        level: "warn",
        event: "auth.change_password.wrong_current",
        userId: session.userId,
        email: session.email,
        ip,
        userAgent,
      });
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }

    const newHash = await bcrypt.hash(body.newPassword, 12);
    db.prepare("UPDATE dashboard_users SET password_hash = ? WHERE id = ?").run(newHash, session.userId);

    log({
      level: "info",
      event: "auth.change_password.success",
      userId: session.userId,
      email: session.email,
      ip,
      userAgent,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[auth/change-password]", err);
    log({
      level: "error",
      event: "auth.change_password.error",
      userId: session.userId,
      email: session.email,
      ip,
      userAgent,
      details: { error: String(err) },
    });
    return NextResponse.json({ error: "An unexpected error occurred. Please try again." }, { status: 500 });
  }
  */
}
